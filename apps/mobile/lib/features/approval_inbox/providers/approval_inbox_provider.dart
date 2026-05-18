import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/approval_inbox_model.dart';
import '../data/repositories/approval_inbox_repository.dart';

part 'approval_inbox_provider.g.dart';

@riverpod
Future<List<ApprovalInboxItem>> approvalInboxItems(
  ApprovalInboxItemsRef ref, {
  String? type,
}) =>
    ref.read(approvalInboxRepositoryProvider).getItems(type: type);

@riverpod
Future<int> approvalInboxCount(ApprovalInboxCountRef ref) =>
    ref.read(approvalInboxRepositoryProvider).getCount();

@riverpod
class ApprovalInboxNotifier extends _$ApprovalInboxNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> approve(ApprovalInboxItem item) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _doAction(item, approve: true));
    if (!state.hasError) {
      ref.invalidate(approvalInboxItemsProvider);
      ref.invalidate(approvalInboxCountProvider);
    }
  }

  Future<void> reject(ApprovalInboxItem item) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _doAction(item, approve: false));
    if (!state.hasError) {
      ref.invalidate(approvalInboxItemsProvider);
      ref.invalidate(approvalInboxCountProvider);
    }
  }

  Future<void> _doAction(ApprovalInboxItem item, {required bool approve}) {
    final repo = ref.read(approvalInboxRepositoryProvider);
    switch (item.type) {
      case 'LEAVE':
        return approve ? repo.approveLeave(item.id) : repo.rejectLeave(item.id);
      case 'EXPENSE':
        return approve ? repo.approveExpense(item.id) : repo.rejectExpense(item.id);
      case 'REGULARISATION':
        return approve
            ? repo.approveRegularisation(item.id)
            : repo.rejectRegularisation(item.id);
      case 'COMP_OFF':
        return approve ? repo.approveCompOff(item.id) : repo.rejectCompOff(item.id);
      default:
        return Future.value();
    }
  }
}
