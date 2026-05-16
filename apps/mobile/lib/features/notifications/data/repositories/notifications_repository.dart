import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/notification_model.dart';
import '../../../../core/dio/dio_client.dart';

part 'notifications_repository.g.dart';

@riverpod
NotificationsRepository notificationsRepository(NotificationsRepositoryRef ref) =>
    NotificationsRepository(dio: ref.read(dioClientProvider));

class NotificationsRepository {
  final Dio _dio;
  const NotificationsRepository({required Dio dio}) : _dio = dio;

  Future<List<AppNotification>> getNotifications({bool unreadOnly = false}) async {
    final res = await _dio.get(
      '/notifications',
      queryParameters: {
        'limit': '50',
        if (unreadOnly) 'unreadOnly': 'true',
      },
    );
    return (res.data['data'] as List)
        .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<int> getUnreadCount() async {
    final res = await _dio.get('/notifications/unread-count');
    return (res.data['data']['count'] as num).toInt();
  }

  Future<void> markRead(String id) async {
    await _dio.patch('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _dio.patch('/notifications/read-all');
  }
}
