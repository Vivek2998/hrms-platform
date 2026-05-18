import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/dio/dio_client.dart';
import '../../../attendance/data/repositories/geofence_repository.dart';

class EmployeeWithLocation {
  final String id;
  final String firstName;
  final String lastName;
  final String employeeCode;
  final String? designation;
  final String? avatarUrl;
  final String? officeLocationId;
  final OfficeLocationSummary? officeLocation;

  const EmployeeWithLocation({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.employeeCode,
    this.designation,
    this.avatarUrl,
    this.officeLocationId,
    this.officeLocation,
  });

  factory EmployeeWithLocation.fromJson(Map<String, dynamic> json) {
    final loc = json['officeLocation'];
    return EmployeeWithLocation(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      employeeCode: json['employeeCode'] as String,
      designation: json['designation'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      officeLocationId: json['officeLocationId'] as String?,
      officeLocation: loc != null
          ? OfficeLocationSummary.fromJson(loc as Map<String, dynamic>)
          : null,
    );
  }
}

class OfficeLocationSummary {
  final String id;
  final String name;

  const OfficeLocationSummary({required this.id, required this.name});

  factory OfficeLocationSummary.fromJson(Map<String, dynamic> json) =>
      OfficeLocationSummary(
        id: json['id'] as String,
        name: json['name'] as String,
      );
}

class AdminRepository {
  final Dio _dio;
  AdminRepository({required Dio dio}) : _dio = dio;

  Future<List<EmployeeWithLocation>> getEmployees() async {
    final res = await _dio.get('/employees');
    final list = res.data['data'] as List<dynamic>;
    return list
        .map((e) => EmployeeWithLocation.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<OfficeLocationConfig>> getOfficeLocations() async {
    final res = await _dio.get('/office-locations');
    final list = res.data['data'] as List<dynamic>;
    return list
        .map((e) => OfficeLocationConfig.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> assignLocation(String employeeId, String? locationId) async {
    await _dio.patch(
      '/office-locations/assign/$employeeId',
      data: {'locationId': locationId},
    );
  }
}

final adminRepositoryProvider = Provider<AdminRepository>((ref) =>
    AdminRepository(dio: ref.read(dioClientProvider)));

final employeeListProvider = FutureProvider<List<EmployeeWithLocation>>((ref) =>
    ref.read(adminRepositoryProvider).getEmployees());

final officeLocationsAdminProvider =
    FutureProvider<List<OfficeLocationConfig>>((ref) =>
        ref.read(adminRepositoryProvider).getOfficeLocations());
