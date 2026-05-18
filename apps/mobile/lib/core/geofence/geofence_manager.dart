import 'package:flutter/foundation.dart';
import 'package:geofence_service/geofence_service.dart' hide LocationPermission;
import 'package:geolocator/geolocator.dart';
import '../notifications/local_notification_service.dart';
import '../../features/attendance/data/repositories/geofence_repository.dart';

class GeofenceManager {
  static final instance = GeofenceManager._();
  GeofenceManager._();

  final _service = GeofenceService.instance.setup(
    interval: 5000,
    accuracy: 100,
    loiteringDelayMs: 0,
    statusChangeDelayMs: 10000,
    allowMockLocations: false,
    printDevLog: false,
  );

  bool _running = false;
  String? _officeName;
  DateTime? _lastNotificationDate;

  /// Called by the UI layer (HomeShell) so tapping the notification navigates
  /// to the punch-in screen without needing a global navigator key.
  VoidCallback? onNotificationTapped;

  /// Requests "always on" location permission needed for background geofencing.
  /// Returns true if the user granted the required level.
  Future<bool> requestBackgroundPermission() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) return false;
    // On Android, "whileInUse" is not enough for background geofencing.
    // Request again to prompt the "always allow" upgrade.
    if (permission == LocationPermission.whileInUse) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  Future<void> start({required OfficeLocationConfig config}) async {
    if (_running) await _doStop();
    _officeName = config.name;

    final geofence = Geofence(
      id: config.id,
      latitude: config.latitude,
      longitude: config.longitude,
      radius: [
        GeofenceRadius(
          id: 'r_${config.radiusMeters}m',
          length: config.radiusMeters.toDouble(),
        ),
      ],
    );

    _service.addGeofenceStatusChangeListener(_onStatusChanged);
    await _service.start([geofence]);
    _running = true;
    debugPrint('[GeofenceManager] started for ${config.name} (${config.radiusMeters}m radius)');
  }

  Future<void> stop() => _doStop();

  Future<void> _doStop() async {
    if (!_running) return;
    _service.removeGeofenceStatusChangeListener(_onStatusChanged);
    await _service.stop();
    _running = false;
    debugPrint('[GeofenceManager] stopped');
  }

  Future<void> _onStatusChanged(
    Geofence geofence,
    GeofenceRadius geofenceRadius,
    GeofenceStatus geofenceStatus,
    Location location,
  ) async {
    if (geofenceStatus != GeofenceStatus.ENTER) return;

    // One notification per calendar day — prevents repeat triggers on brief exits/entries.
    final now = DateTime.now();
    if (_lastNotificationDate != null &&
        _lastNotificationDate!.year == now.year &&
        _lastNotificationDate!.month == now.month &&
        _lastNotificationDate!.day == now.day) {
      return;
    }
    _lastNotificationDate = now;

    debugPrint('[GeofenceManager] ENTER detected — showing smart punch notification');
    LocalNotificationService.instance.setOnTapped(() => onNotificationTapped?.call());
    await LocalNotificationService.instance.showSmartPunchNotification(
      _officeName ?? 'Office',
    );
  }
}
