import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/regularisation_model.dart';
import '../data/repositories/regularisation_repository.dart';
import '../../../core/dio/dio_client.dart';

final regularisationRepositoryProvider =
    Provider<RegularisationRepository>((ref) {
  return RegularisationRepository(dio: ref.read(dioClientProvider));
});

final regularisationListProvider =
    FutureProvider.autoDispose<List<RegularisationRequest>>((ref) {
  return ref.read(regularisationRepositoryProvider).getMyRequests();
});

class CreateRegularisationNotifier
    extends StateNotifier<AsyncValue<RegularisationRequest?>> {
  final RegularisationRepository _repo;
  final Ref _ref;

  CreateRegularisationNotifier(this._repo, this._ref)
      : super(const AsyncData(null));

  Future<bool> create({
    required String date,
    String? requestedIn,
    String? requestedOut,
    required String reason,
  }) async {
    state = const AsyncLoading();
    try {
      final result = await _repo.create(
        date: date,
        requestedIn: requestedIn,
        requestedOut: requestedOut,
        reason: reason,
      );
      state = AsyncData(result);
      _ref.invalidate(regularisationListProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final createRegularisationProvider = StateNotifierProvider.autoDispose<
    CreateRegularisationNotifier,
    AsyncValue<RegularisationRequest?>>((ref) {
  return CreateRegularisationNotifier(
      ref.read(regularisationRepositoryProvider), ref);
});
