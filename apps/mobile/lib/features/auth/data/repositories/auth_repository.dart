import 'package:dio/dio.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/auth_model.dart';
import '../../../../core/dio/dio_client.dart';
import '../../../../core/isar/isar_service.dart';
import '../../../../core/storage/secure_storage.dart';

part 'auth_repository.g.dart';

@riverpod
AuthRepository authRepository(AuthRepositoryRef ref) => AuthRepository(
      dio: ref.read(dioClientProvider),
      storage: ref.read(secureStorageProvider),
      isar: IsarService.instance,
    );

class AuthRepository {
  final Dio _dio;
  final SecureStorageService _storage;
  final Isar _isar;

  AuthRepository({
    required Dio dio,
    required SecureStorageService storage,
    required Isar isar,
  })  : _dio = dio,
        _storage = storage,
        _isar = isar;

  Future<CachedUser> login({
    required String email,
    required String password,
  }) async {
    final res = await _dio.post(
      '/auth/login',
      data: {'email': email.trim().toLowerCase(), 'password': password},
    );
    final data = res.data['data'] as Map<String, dynamic>;

    await _storage.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );

    final emp = data['employee'] as Map<String, dynamic>;
    final user = CachedUser()
      ..employeeId = emp['id'] as String
      ..organizationId = emp['organizationId'] as String
      ..firstName = emp['firstName'] as String
      ..lastName = emp['lastName'] as String
      ..workEmail = emp['workEmail'] as String
      ..employeeCode = emp['employeeCode'] as String
      ..role = emp['role'] as String
      ..avatarUrl = emp['avatarUrl'] as String?
      ..mustChangePassword = emp['mustChangePassword'] as bool? ?? false
      ..cachedAt = DateTime.now();

    await _isar.writeTxn(() async {
      // Clear stale records first — prevents unique-index violation when
      // session expires without a proper logout (Isar is not cleared in that path).
      await _isar.cachedUsers.clear();
      await _isar.cachedUsers.put(user);
    });
    await _storage.saveEmployeeId(user.employeeId);
    await _storage.saveOrganizationId(user.organizationId);
    await _storage.saveOrgBranding(
      orgName: emp['orgName'] as String?,
      orgLogoUrl: emp['orgLogoUrl'] as String?,
    );
    return user;
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _dio.post('/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
      'confirmPassword': newPassword,
    });
    // Update Isar directly — avoids a secure-storage read that can stall on Windows.
    await _isar.writeTxn(() async {
      final users = await _isar.cachedUsers.where().findAll();
      for (final u in users) {
        if (u.mustChangePassword) {
          u.mustChangePassword = false;
          await _isar.cachedUsers.put(u);
        }
      }
    });
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {
      // Network or server error — ignore and clear local state anyway.
    }
    await _storage.clearAll();
    await _isar.writeTxn(() => _isar.cachedUsers.clear());
  }

  Future<CachedUser?> getCachedUser() async {
    final id = await _storage.getEmployeeId();
    if (id == null) return null;
    return _isar.cachedUsers.filter().employeeIdEqualTo(id).findFirst();
  }

  Future<({String? orgName, String? orgLogoUrl})> getOrgBranding() async {
    return (
      orgName: await _storage.getOrgName(),
      orgLogoUrl: await _storage.getOrgLogoUrl(),
    );
  }
}
