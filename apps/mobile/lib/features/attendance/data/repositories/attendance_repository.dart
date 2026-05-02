import 'package:dio/dio.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/attendance_model.dart';
import '../../../../core/dio/dio_client.dart';
import '../../../../core/isar/isar_service.dart';
import '../../../../core/storage/secure_storage.dart';

part 'attendance_repository.g.dart';

@riverpod
AttendanceRepository attendanceRepository(AttendanceRepositoryRef ref) =>
    AttendanceRepository(
      dio: ref.read(dioClientProvider),
      storage: ref.read(secureStorageProvider),
      isar: IsarService.instance,
    );

class AttendanceRepository {
  final Dio _dio;
  final SecureStorageService _storage;
  final Isar _isar;

  AttendanceRepository({
    required Dio dio,
    required SecureStorageService storage,
    required Isar isar,
  })  : _dio = dio,
        _storage = storage,
        _isar = isar;

  Future<List<CachedAttendanceRecord>> getMyAttendance({
    int month = 0,
    int year = 0,
  }) async {
    final now = DateTime.now();
    final m = month == 0 ? now.month : month;
    final y = year == 0 ? now.year : year;
    try {
      final res = await _dio.get(
        '/attendance/my',
        queryParameters: {'month': m, 'year': y},
      );
      final records = (res.data['data'] as List)
          .map((e) => _mapToModel(e as Map<String, dynamic>))
          .toList();
      await _isar.writeTxn(() => _isar.cachedAttendanceRecords.putAll(records));
      return records;
    } catch (_) {
      return _isar.cachedAttendanceRecords
          .filter()
          .cachedAtGreaterThan(DateTime(y, m, 1))
          .findAll();
    }
  }

  Future<Map<String, dynamic>> punchIn({
    required double latitude,
    required double longitude,
    String? selfieUrl,
  }) async {
    final res = await _dio.post('/attendance/punch-in', data: {
      'latitude': latitude,
      'longitude': longitude,
      if (selfieUrl != null) 'selfieUrl': selfieUrl,
    });
    return res.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> punchOut({
    required double latitude,
    required double longitude,
  }) async {
    final res = await _dio.post('/attendance/punch-out', data: {
      'latitude': latitude,
      'longitude': longitude,
    });
    return res.data['data'] as Map<String, dynamic>;
  }

  CachedAttendanceRecord _mapToModel(Map<String, dynamic> e) =>
      CachedAttendanceRecord()
        ..recordId = e['id'] as String
        ..employeeId = e['employeeId'] as String
        ..organizationId = e['organizationId'] as String
        ..date = DateTime.parse(e['date'] as String)
        ..status = e['status'] as String
        ..punchIn =
            e['punchIn'] != null ? DateTime.parse(e['punchIn'] as String) : null
        ..punchOut = e['punchOut'] != null
            ? DateTime.parse(e['punchOut'] as String)
            : null
        ..lateMinutes = e['lateMinutes'] as int?
        ..workingMinutes = e['workingMinutes'] as int?
        ..overtimeMinutes = e['overtimeMinutes'] as int?
        ..cachedAt = DateTime.now();
}
