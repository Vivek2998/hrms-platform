import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/leave_model.dart';
import '../data/repositories/leave_repository.dart';

part 'leave_provider.g.dart';

@riverpod
Future<List<ApiLeaveType>> leaveTypes(LeaveTypesRef ref) {
  return ref.read(leaveRepositoryProvider).getLeaveTypes();
}

@riverpod
Future<List<CachedLeaveRequest>> leaveList(LeaveListRef ref) {
  return ref.read(leaveRepositoryProvider).getMyLeaves();
}

@riverpod
Future<List<LeaveBalance>> leaveBalances(LeaveBalancesRef ref) {
  return ref.read(leaveRepositoryProvider).getMyBalances();
}

@riverpod
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
