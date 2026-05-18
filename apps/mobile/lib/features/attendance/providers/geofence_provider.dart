import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/repositories/geofence_repository.dart';
import '../../../core/geofence/geofence_manager.dart';
import '../../../core/storage/secure_storage.dart';

part 'geofence_provider.g.dart';

/// Fetches the current employee's assigned office location config from API.
@riverpod
Future<OfficeLocationConfig?> geofenceConfig(GeofenceConfigRef ref) =>
    ref.read(geofenceRepositoryProvider).getGeofenceConfig();

/// Whether Smart Punch-In is enabled — reads from secure storage.
@riverpod
class SmartPunchNotifier extends _$SmartPunchNotifier {
  @override
  Future<bool> build() =>
      ref.read(secureStorageProvider).getSmartPunchEnabled();

  Future<void> setEnabled(bool value) async {
    await ref.read(secureStorageProvider).setSmartPunchEnabled(value);
    state = AsyncData(value);

    if (value) {
      // Start geofence if we have a config.
      final config = await ref.read(geofenceConfigProvider.future);
      if (config != null) {
        await GeofenceManager.instance.start(config: config);
      }
    } else {
      await GeofenceManager.instance.stop();
    }
  }
}
