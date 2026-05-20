import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/benefit_model.dart';
import '../data/repositories/benefit_repository.dart';
import '../../../core/dio/dio_client.dart';

final benefitRepositoryProvider = Provider<BenefitRepository>((ref) {
  return BenefitRepository(dio: ref.read(dioClientProvider));
});

final benefitPlansProvider =
    FutureProvider.autoDispose<List<BenefitPlan>>((ref) {
  return ref.read(benefitRepositoryProvider).getPlans();
});

class BenefitNotifier extends StateNotifier<AsyncValue<void>> {
  final BenefitRepository _repo;
  final Ref _ref;

  BenefitNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> enroll(String planId, {bool waive = false}) async {
    state = const AsyncLoading();
    try {
      await _repo.enroll(planId, waive: waive);
      state = const AsyncData(null);
      _ref.invalidate(benefitPlansProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final benefitNotifierProvider =
    StateNotifierProvider.autoDispose<BenefitNotifier, AsyncValue<void>>(
        (ref) =>
            BenefitNotifier(ref.read(benefitRepositoryProvider), ref));
