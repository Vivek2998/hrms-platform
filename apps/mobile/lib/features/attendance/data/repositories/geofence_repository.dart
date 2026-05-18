import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';

part 'geofence_repository.g.dart';

class OfficeLocationConfig {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final int radiusMeters;

  const OfficeLocationConfig({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
  });

  factory OfficeLocationConfig.fromJson(Map<String, dynamic> json) =>
      OfficeLocationConfig(
        id: json['id'] as String,
        name: json['name'] as String,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        radiusMeters: json['radiusMeters'] as int,
      );
}

@riverpod
GeofenceRepository geofenceRepository(GeofenceRepositoryRef ref) =>
    GeofenceRepository(dio: ref.read(dioClientProvider));

class GeofenceRepository {
  final Dio _dio;
  GeofenceRepository({required Dio dio}) : _dio = dio;

  /// Returns null if the employee has no assigned office location.
  Future<OfficeLocationConfig?> getGeofenceConfig() async {
    final res = await _dio.get('/attendance/geofence-config');
    final loc = res.data['data']['officeLocation'];
    if (loc == null) return null;
    return OfficeLocationConfig.fromJson(loc as Map<String, dynamic>);
  }
}
