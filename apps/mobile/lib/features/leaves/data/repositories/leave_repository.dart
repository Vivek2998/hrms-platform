import 'package:dio/dio.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/leave_model.dart';
import '../../../../core/dio/dio_client.dart';
import '../../../../core/isar/isar_service.dart';
import '../../../../core/storage/secure_storage.dart';

part 'leave_repository.g.dart';

@riverpod
LeaveRepository leaveRepository(LeaveRepositoryRef ref) => LeaveRepository(
      dio: ref.read(dioClientProvider),
      storage: ref.read(secureStorageProvider),
      isar: IsarService.instance,
    );

class LeaveRepository {
  final Dio _dio;
  final SecureStorageService _storage;
  final Isar _isar;

  LeaveRepository({
    required Dio dio,
    required SecureStorageService storage,
    required Isar isar,
  })  : _dio = dio,
        _storage = storage,
        _isar = isar;

  Future<List<CachedLeaveRequest>> getMyLeaves() async {
    try {
      final res = await _dio.get('/leaves/my');
      final leaves = (res.data['data'] as List)
          .map((e) => _mapToModel(e as Map<String, dynamic>))
          .toList();
      await _isar.writeTxn(() => _isar.cachedLeaveRequests.putAll(leaves));
      return leaves;
    } catch (_) {
      return _isar.cachedLeaveRequests.where().findAll();
    }
  }

  Future<List<ApiLeaveType>> getLeaveTypes() async {
    final res = await _dio.get('/leave-types');
    return (res.data['data'] as List)
        .map((e) => ApiLeaveType.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<LeaveBalance>> getMyBalances() async {
    try {
      final res = await _dio.get('/leaves/my/balance');
      return (res.data['data'] as List)
          .map((e) => LeaveBalance.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> applyLeave({
    required String leaveTypeId,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    String? session, // 'FIRST_HALF' | 'SECOND_HALF' for half-day leave
  }) async {
    await _dio.post('/leaves', data: {
      'leaveTypeId': leaveTypeId,
      'startDate': startDate.toIso8601String().substring(0, 10),
      'endDate': endDate.toIso8601String().substring(0, 10),
      'reason': reason,
      if (session != null) 'session': session,
    });
  }

  Future<List<PendingLeaveRequest>> getPendingLeaves() async {
    final res = await _dio.get('/leaves',
        queryParameters: {'status': 'PENDING', 'limit': 50});
    return (res.data['data'] as List)
        .map((e) => PendingLeaveRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> approveLeave(String id, String action, {String? remarks}) async {
    await _dio.patch('/leaves/$id/approve', data: {
      'action': action,
      if (remarks != null && remarks.isNotEmpty) 'remarks': remarks,
    });
  }

  Future<void> cancelLeave(String leaveId) async {
    await _dio.patch('/leaves/$leaveId/cancel');
  }

  Future<void> applyLeaveOnBehalf({
    required String employeeId,
    required String leaveTypeId,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    String? session,
  }) async {
    await _dio.post('/leaves/behalf', data: {
      'employeeId': employeeId,
      'leaveTypeId': leaveTypeId,
      'startDate': startDate.toIso8601String().substring(0, 10),
      'endDate': endDate.toIso8601String().substring(0, 10),
      'reason': reason,
      if (session != null) 'session': session,
    });
  }

  CachedLeaveRequest _mapToModel(Map<String, dynamic> e) {
    final leaveType = e['leaveType'] as Map<String, dynamic>;
    return CachedLeaveRequest()
      ..leaveId = e['id'] as String
      ..employeeId = e['employeeId'] as String
      ..organizationId = e['organizationId'] as String
      ..leaveTypeName = leaveType['name'] as String
      ..leaveTypeCode = leaveType['code'] as String
      ..startDate = DateTime.parse(e['startDate'] as String)
      ..endDate = DateTime.parse(e['endDate'] as String)
      ..totalDays = (e['totalDays'] as num).toDouble()
      ..status = e['status'] as String
      ..reason = e['reason'] as String
      ..remarks = e['remarks'] as String?
      ..appliedAt = DateTime.parse(e['appliedAt'] as String)
      ..cachedAt = DateTime.now();
  }
}
