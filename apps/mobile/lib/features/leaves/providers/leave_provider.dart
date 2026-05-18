import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/leave_model.dart';
import '../data/repositories/leave_repository.dart';

part 'leave_provider.g.dart';

@Riverpod(keepAlive: true)
Future<List<ApiLeaveType>> leaveTypes(LeaveTypesRef ref) {
  return ref.read(leaveRepositoryProvider).getLeaveTypes();
}

@Riverpod(keepAlive: true)
Future<List<CachedLeaveRequest>> leaveList(LeaveListRef ref) {
  return ref.read(leaveRepositoryProvider).getMyLeaves();
}

@Riverpod(keepAlive: true)
Future<List<LeaveBalance>> leaveBalances(LeaveBalancesRef ref) {
  return ref.read(leaveRepositoryProvider).getMyBalances();
}

@Riverpod(keepAlive: true)
Future<List<PendingLeaveRequest>> pendingLeaves(PendingLeavesRef ref) {
  return ref.read(leaveRepositoryProvider).getPendingLeaves();
}

@riverpod
class LeaveApprovalNotifier extends _$LeaveApprovalNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> approve(String id, String action, {String? remarks}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(leaveRepositoryProvider).approveLeave(id, action, remarks: remarks),
    );
    if (state.hasValue) ref.invalidate(pendingLeavesProvider);
  }
}

@riverpod
class ApplyLeaveNotifier extends _$ApplyLeaveNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> apply({
    required String leaveTypeId,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    String? session,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(leaveRepositoryProvider).applyLeave(
            leaveTypeId: leaveTypeId,
            startDate: startDate,
            endDate: endDate,
            reason: reason,
            session: session,
          ),
    );
    if (state.hasValue) ref.invalidate(leaveListProvider);
  }
}

@riverpod
class CancelLeaveNotifier extends _$CancelLeaveNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> cancel(String leaveId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(leaveRepositoryProvider).cancelLeave(leaveId),
    );
    if (state.hasValue) {
      ref.invalidate(leaveListProvider);
      ref.invalidate(leaveBalancesProvider);
    }
  }
}

@riverpod
class ApplyLeaveBehalfNotifier extends _$ApplyLeaveBehalfNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> apply({
    required String employeeId,
    required String leaveTypeId,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    String? session,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(leaveRepositoryProvider).applyLeaveOnBehalf(
            employeeId: employeeId,
            leaveTypeId: leaveTypeId,
            startDate: startDate,
            endDate: endDate,
            reason: reason,
            session: session,
          ),
    );
    if (state.hasValue) ref.invalidate(pendingLeavesProvider);
  }
}
