import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../data/models/biometric_device_model.dart';
import '../data/repositories/biometric_device_repository.dart';

final biometricDeviceRepositoryProvider = Provider<BiometricDeviceRepository>(
  (ref) => BiometricDeviceRepository(dio: ref.read(dioClientProvider)),
);

final biometricDevicesProvider =
    FutureProvider.autoDispose<List<BiometricDevice>>((ref) {
  return ref.read(biometricDeviceRepositoryProvider).getDevices();
});
