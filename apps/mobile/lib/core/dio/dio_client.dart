import 'dart:async';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../constants/api_constants.dart';
import '../providers/session_provider.dart';
import '../storage/secure_storage.dart';

part 'dio_client.g.dart';

@riverpod
Dio dioClient(DioClientRef ref) {
  final storage = ref.read(secureStorageProvider);
  final dio = Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    connectTimeout: ApiConstants.connectTimeout,
    receiveTimeout: ApiConstants.receiveTimeout,
    headers: {'Content-Type': 'application/json'},
  ));
  dio.interceptors.add(_AuthInterceptor(dio, storage, onSessionExpired: () {
    ref.read(sessionExpiredProvider.notifier).update((n) => n + 1);
  }));
  return dio;
}

class _AuthInterceptor extends Interceptor {
  final Dio _dio;
  final SecureStorageService _storage;
  final void Function() onSessionExpired;
  bool _isRefreshing = false;
  final List<Completer<String>> _refreshQueue = [];

  _AuthInterceptor(this._dio, this._storage, {required this.onSessionExpired});

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401) {
      handler.next(err);
      return;
    }
    // The refresh endpoint itself returned 401 — tokens are truly invalid.
    // Bail immediately to avoid deadlock (onError re-entering while _isRefreshing).
    if (err.requestOptions.path.contains('/auth/refresh')) {
      handler.next(err);
      return;
    }

    if (_isRefreshing) {
      final completer = Completer<String>();
      _refreshQueue.add(completer);
      try {
        final token = await completer.future;
        err.requestOptions.headers['Authorization'] = 'Bearer $token';
        handler.resolve(await _dio.fetch(err.requestOptions));
      } catch (e) {
        handler.next(err);
      }
      return;
    }

    _isRefreshing = true;
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) throw Exception('No refresh token');

      final res = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(headers: {'Authorization': ''}),
      );

      final newAccess = res.data['data']['accessToken'] as String;
      final newRefresh = res.data['data']['refreshToken'] as String;
      await _storage.saveTokens(
        accessToken: newAccess,
        refreshToken: newRefresh,
      );

      for (final c in _refreshQueue) {
        c.complete(newAccess);
      }
      _refreshQueue.clear();

      err.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
      handler.resolve(await _dio.fetch(err.requestOptions));
    } catch (e) {
      for (final c in _refreshQueue) {
        c.completeError(e);
      }
      _refreshQueue.clear();
      await _storage.clearAll();
      onSessionExpired();
      handler.next(err);
    } finally {
      _isRefreshing = false;
    }
  }
}
