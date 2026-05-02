import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'secure_storage.g.dart';

@riverpod
SecureStorageService secureStorage(SecureStorageRef ref) => SecureStorageService();

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _employeeIdKey = 'employee_id';
  static const _organizationIdKey = 'organization_id';

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> saveEmployeeId(String id) =>
      _storage.write(key: _employeeIdKey, value: id);
  Future<String?> getEmployeeId() => _storage.read(key: _employeeIdKey);

  Future<void> saveOrganizationId(String id) =>
      _storage.write(key: _organizationIdKey, value: id);
  Future<String?> getOrganizationId() =>
      _storage.read(key: _organizationIdKey);

  Future<void> clearAll() => _storage.deleteAll();
}
