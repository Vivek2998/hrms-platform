import 'package:dio/dio.dart';
import '../models/biometric_device_model.dart';

class BiometricDeviceRepository {
  final Dio _dio;
  BiometricDeviceRepository({required Dio dio}) : _dio = dio;

  Future<List<BiometricDevice>> getDevices() async {
    final r = await _dio.get('/biometric-devices');
    return (r.data['data'] as List)
        .map((e) => BiometricDevice.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
