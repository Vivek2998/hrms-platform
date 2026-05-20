import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../data/models/attrition_model.dart';
import '../data/repositories/attrition_repository.dart';

final attritionRepositoryProvider = Provider<AttritionRepository>(
  (ref) => AttritionRepository(dio: ref.read(dioClientProvider)),
);

final attritionScoresProvider =
    FutureProvider.autoDispose<List<AttritionScore>>((ref) {
  return ref.read(attritionRepositoryProvider).getScores();
});

class AttritionNotifier extends StateNotifier<AsyncValue<void>> {
  final AttritionRepository _repo;
  final Ref _ref;

  AttritionNotifier(this._repo, this._ref) : super(const AsyncValue.data(null));

  Future<void> computeScores() async {
    state = const AsyncValue.loading();
    try {
      await _repo.computeScores();
      _ref.invalidate(attritionScoresProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final attritionNotifierProvider =
    StateNotifierProvider<AttritionNotifier, AsyncValue<void>>((ref) {
  return AttritionNotifier(
    ref.read(attritionRepositoryProvider),
    ref,
  );
});
