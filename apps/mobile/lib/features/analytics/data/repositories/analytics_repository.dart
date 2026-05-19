import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/analytics_model.dart';

part 'analytics_repository.g.dart';

@riverpod
AnalyticsRepository analyticsRepository(AnalyticsRepositoryRef ref) =>
    AnalyticsRepository(dio: ref.read(dioClientProvider));

class AnalyticsRepository {
  final Dio _dio;
  AnalyticsRepository({required Dio dio}) : _dio = dio;

  Future<AnalyticsOverview> getOverview() async {
    final res = await _dio.get('/analytics/overview');
    return AnalyticsOverview.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<List<HeadcountPoint>> getHeadcountTrend() async {
    final res = await _dio.get('/analytics/headcount-trend');
    return (res.data['data'] as List)
        .map((e) => HeadcountPoint.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<DepartmentBreakdown>> getDepartmentBreakdown() async {
    final res = await _dio.get('/analytics/department-breakdown');
    return (res.data['data'] as List)
        .map((e) => DepartmentBreakdown.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AttendanceSummary>> getAttendanceSummary() async {
    final res = await _dio.get('/analytics/attendance-summary');
    return (res.data['data'] as List)
        .map((e) => AttendanceSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<LeaveUtilization>> getLeaveUtilization() async {
    final res = await _dio.get('/analytics/leave-utilization');
    return (res.data['data'] as List)
        .map((e) => LeaveUtilization.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<PayrollPoint>> getPayrollTrend() async {
    final res = await _dio.get('/analytics/payroll-trend');
    return (res.data['data'] as List)
        .map((e) => PayrollPoint.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
