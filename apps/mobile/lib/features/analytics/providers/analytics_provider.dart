import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/analytics_model.dart';
import '../data/repositories/analytics_repository.dart';

part 'analytics_provider.g.dart';

@riverpod
Future<AnalyticsOverview> analyticsOverview(AnalyticsOverviewRef ref) =>
    ref.read(analyticsRepositoryProvider).getOverview();

@riverpod
Future<List<HeadcountPoint>> headcountTrend(HeadcountTrendRef ref) =>
    ref.read(analyticsRepositoryProvider).getHeadcountTrend();

@riverpod
Future<List<DepartmentBreakdown>> departmentBreakdown(DepartmentBreakdownRef ref) =>
    ref.read(analyticsRepositoryProvider).getDepartmentBreakdown();

@riverpod
Future<List<AttendanceSummary>> attendanceSummary(AttendanceSummaryRef ref) =>
    ref.read(analyticsRepositoryProvider).getAttendanceSummary();

@riverpod
Future<List<LeaveUtilization>> leaveUtilization(LeaveUtilizationRef ref) =>
    ref.read(analyticsRepositoryProvider).getLeaveUtilization();

@riverpod
Future<List<PayrollPoint>> payrollTrend(PayrollTrendRef ref) =>
    ref.read(analyticsRepositoryProvider).getPayrollTrend();
