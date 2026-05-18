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
  static const _smartPunchKey = 'smart_punch_enabled';
  static const _orgNameKey = 'org_name';
  static const _orgLogoUrlKey = 'org_logo_url';

  // Static in-memory overlay for all 4 keys.
  // Windows Credential Manager (DPAPI) reads can stall indefinitely on Windows
  // desktop. We read from persistent storage once at cold start; every
  // subsequent read within the same session returns from memory instantly.
  // Static survives Riverpod provider re-creation; cleared on logout/expiry.
  static String? _memAccessToken;
  static String? _memRefreshToken;
  static String? _memEmployeeId;
  static String? _memOrganizationId;
  static String? _memOrgName;
  static String? _memOrgLogoUrl;

  static const _kReadTimeout = Duration(seconds: 8);

  // ── reads ──────────────────────────────────────────────────────────────────

  Future<String?> getAccessToken() async {
    if (_memAccessToken != null) return _memAccessToken;
    final v = await _storage
        .read(key: _accessTokenKey)
        .timeout(_kReadTimeout, onTimeout: () => null);
    _memAccessToken = v;
    return v;
  }

  Future<String?> getRefreshToken() async {
    if (_memRefreshToken != null) return _memRefreshToken;
    final v = await _storage
        .read(key: _refreshTokenKey)
        .timeout(_kReadTimeout, onTimeout: () => null);
    _memRefreshToken = v;
    return v;
  }

  Future<String?> getEmployeeId() async {
    if (_memEmployeeId != null) return _memEmployeeId;
    final v = await _storage
        .read(key: _employeeIdKey)
        .timeout(_kReadTimeout, onTimeout: () => null);
    _memEmployeeId = v;
    return v;
  }

  Future<String?> getOrganizationId() async {
    if (_memOrganizationId != null) return _memOrganizationId;
    final v = await _storage
        .read(key: _organizationIdKey)
        .timeout(_kReadTimeout, onTimeout: () => null);
    _memOrganizationId = v;
    return v;
  }

  // ── writes ─────────────────────────────────────────────────────────────────

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    _memAccessToken = accessToken;
    _memRefreshToken = refreshToken;
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<void> saveEmployeeId(String id) async {
    _memEmployeeId = id;
    await _storage.write(key: _employeeIdKey, value: id);
  }

  Future<void> saveOrganizationId(String id) async {
    _memOrganizationId = id;
    await _storage.write(key: _organizationIdKey, value: id);
  }

  Future<String?> getOrgName() async {
    if (_memOrgName != null) return _memOrgName;
    final v = await _storage
        .read(key: _orgNameKey)
        .timeout(_kReadTimeout, onTimeout: () => null);
    _memOrgName = v;
    return v;
  }

  Future<String?> getOrgLogoUrl() async {
    if (_memOrgLogoUrl != null) return _memOrgLogoUrl;
    final v = await _storage
        .read(key: _orgLogoUrlKey)
        .timeout(_kReadTimeout, onTimeout: () => null);
    _memOrgLogoUrl = v;
    return v;
  }

  Future<void> saveOrgBranding({String? orgName, String? orgLogoUrl}) async {
    _memOrgName = orgName;
    _memOrgLogoUrl = orgLogoUrl;
    await Future.wait([
      if (orgName != null) _storage.write(key: _orgNameKey, value: orgName),
      if (orgLogoUrl != null) _storage.write(key: _orgLogoUrlKey, value: orgLogoUrl),
    ]);
  }

  // ── smart punch preference ─────────────────────────────────────────────────

  Future<bool> getSmartPunchEnabled() async {
    final v = await _storage
        .read(key: _smartPunchKey)
        .timeout(_kReadTimeout, onTimeout: () => null);
    return v == '1';
  }

  Future<void> setSmartPunchEnabled(bool enabled) =>
      _storage.write(key: _smartPunchKey, value: enabled ? '1' : '0');

  // ── clear ──────────────────────────────────────────────────────────────────

  Future<void> clearAll() async {
    _memAccessToken = null;
    _memRefreshToken = null;
    _memEmployeeId = null;
    _memOrganizationId = null;
    _memOrgName = null;
    _memOrgLogoUrl = null;
    try {
      await _storage.deleteAll().timeout(_kReadTimeout);
    } catch (_) {}
  }
}
