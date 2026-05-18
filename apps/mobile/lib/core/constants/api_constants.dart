import 'dart:io';

class ApiConstants {
  static String get baseUrl {
    const env = String.fromEnvironment('API_BASE_URL');
    if (env.isNotEmpty) return env;
    // Physical Android device uses the host machine's LAN IP.
    // Android emulator would use 10.0.2.2, but we're targeting physical devices.
    if (Platform.isAndroid) return 'http://192.168.1.40:3000/api/v1';
    return 'http://localhost:3000/api/v1';
  }

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
