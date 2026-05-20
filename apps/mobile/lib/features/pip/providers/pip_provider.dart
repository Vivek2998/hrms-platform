import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/pip_model.dart';
import '../data/repositories/pip_repository.dart';
import '../../../core/dio/dio_client.dart';

final pipRepositoryProvider = Provider<PIPRepository>((ref) {
  return PIPRepository(dio: ref.read(dioClientProvider));
});

final pipListProvider = FutureProvider.autoDispose<List<PIP>>((ref) {
  return ref.read(pipRepositoryProvider).getPIPs();
});

class PIPNotifier extends StateNotifier<AsyncValue<void>> {
  final PIPRepository _repo;
  final Ref _ref;

  PIPNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> addCheckIn(String id,
      {required String note, int? progressPct}) async {
    state = const AsyncLoading();
    try {
      await _repo.addCheckIn(id, note: note, progressPct: progressPct);
      state = const AsyncData(null);
      _ref.invalidate(pipListProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final pipNotifierProvider =
    StateNotifierProvider.autoDispose<PIPNotifier, AsyncValue<void>>(
        (ref) => PIPNotifier(ref.read(pipRepositoryProvider), ref));
