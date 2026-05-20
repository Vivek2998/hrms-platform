import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/salary_revision_model.dart';
import '../data/repositories/salary_revision_repository.dart';
import '../../../core/dio/dio_client.dart';

final salaryRevisionRepositoryProvider =
    Provider<SalaryRevisionRepository>((ref) {
  return SalaryRevisionRepository(dio: ref.read(dioClientProvider));
});

final salaryRevisionProposalsProvider =
    FutureProvider.autoDispose<List<SalaryRevisionProposal>>((ref) {
  return ref.read(salaryRevisionRepositoryProvider).getProposals();
});

class SalaryRevisionNotifier extends StateNotifier<AsyncValue<void>> {
  final SalaryRevisionRepository _repo;
  final Ref _ref;

  SalaryRevisionNotifier(this._repo, this._ref)
      : super(const AsyncData(null));

  Future<bool> approve(String id) async {
    state = const AsyncLoading();
    try {
      await _repo.approve(id);
      state = const AsyncData(null);
      _ref.invalidate(salaryRevisionProposalsProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }

  Future<bool> reject(String id, {String? reason}) async {
    state = const AsyncLoading();
    try {
      await _repo.reject(id, reason: reason);
      state = const AsyncData(null);
      _ref.invalidate(salaryRevisionProposalsProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final salaryRevisionNotifierProvider =
    StateNotifierProvider.autoDispose<SalaryRevisionNotifier, AsyncValue<void>>(
        (ref) => SalaryRevisionNotifier(
            ref.read(salaryRevisionRepositoryProvider), ref));
