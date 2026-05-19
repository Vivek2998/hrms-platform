import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/shift_swap_model.dart';
import '../data/repositories/shift_swap_repository.dart';
import '../../../core/dio/dio_client.dart';

final shiftSwapRepositoryProvider = Provider<ShiftSwapRepository>((ref) {
  return ShiftSwapRepository(dio: ref.read(dioClientProvider));
});

final shiftSwapListProvider =
    FutureProvider.autoDispose<List<ShiftSwapRequest>>((ref) {
  return ref.read(shiftSwapRepositoryProvider).getMyRequests();
});

class CreateShiftSwapNotifier
    extends StateNotifier<AsyncValue<ShiftSwapRequest?>> {
  final ShiftSwapRepository _repo;
  final Ref _ref;

  CreateShiftSwapNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> create({
    required String targetEmployeeId,
    required String requesterDate,
    required String targetDate,
    String? reason,
  }) async {
    state = const AsyncLoading();
    try {
      final result = await _repo.create(
        targetEmployeeId: targetEmployeeId,
        requesterDate: requesterDate,
        targetDate: targetDate,
        reason: reason,
      );
      state = AsyncData(result);
      _ref.invalidate(shiftSwapListProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final createShiftSwapProvider = StateNotifierProvider.autoDispose<
    CreateShiftSwapNotifier, AsyncValue<ShiftSwapRequest?>>((ref) {
  return CreateShiftSwapNotifier(ref.read(shiftSwapRepositoryProvider), ref);
});
