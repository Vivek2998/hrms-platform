import 'dart:io';

// Run the app via .\run_mobile.ps1 at the repo root — it auto-detects the
// current Wi-Fi IP and passes it as API_BASE_URL at build time.
// The IP below is only a fallback when running flutter run directly.
const _kFallbackIp = '172.16.4.43';

class ApiConstants {
  static String get baseUrl {
    const env = String.fromEnvironment('API_BASE_URL');
    if (env.isNotEmpty) return env;
    if (Platform.isAndroid) return 'http://$_kFallbackIp:3000/api/v1';
    return 'http://localhost:3000/api/v1';
  }

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
