import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/comp_off_model.dart';
import '../data/repositories/comp_off_repository.dart';
import '../../../core/dio/dio_client.dart';

final compOffRepositoryProvider = Provider<CompOffRepository>((ref) {
  return CompOffRepository(dio: ref.read(dioClientProvider));
});

final compOffListProvider =
    FutureProvider.autoDispose<List<CompOffRequest>>((ref) {
  return ref.read(compOffRepositoryProvider).getMyRequests();
});

class CreateCompOffNotifier
    extends StateNotifier<AsyncValue<CompOffRequest?>> {
  final CompOffRepository _repo;
  final Ref _ref;

  CreateCompOffNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> create({
    required String workedDate,
    String? requestedDate,
    required String reason,
  }) async {
    state = const AsyncLoading();
    try {
      final result = await _repo.create(
        workedDate: workedDate,
        requestedDate: requestedDate,
        reason: reason,
      );
      state = AsyncData(result);
      _ref.invalidate(compOffListProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final createCompOffProvider = StateNotifierProvider.autoDispose<
    CreateCompOffNotifier,
    AsyncValue<CompOffRequest?>>((ref) {
  return CreateCompOffNotifier(ref.read(compOffRepositoryProvider), ref);
});
