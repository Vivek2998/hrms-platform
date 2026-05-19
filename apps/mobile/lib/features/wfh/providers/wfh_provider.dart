import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/wfh_model.dart';
import '../data/repositories/wfh_repository.dart';
import '../../../core/dio/dio_client.dart';

final wfhRepositoryProvider = Provider<WFHRepository>((ref) {
  return WFHRepository(dio: ref.read(dioClientProvider));
});

final wfhListProvider = FutureProvider.autoDispose<List<WFHRequest>>((ref) {
  return ref.read(wfhRepositoryProvider).getMyRequests();
});

class CreateWFHNotifier extends StateNotifier<AsyncValue<WFHRequest?>> {
  final WFHRepository _repo;
  final Ref _ref;

  CreateWFHNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> create({required String date, required String reason}) async {
    state = const AsyncLoading();
    try {
      final result = await _repo.create(date: date, reason: reason);
      state = AsyncData(result);
      _ref.invalidate(wfhListProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final createWFHProvider = StateNotifierProvider.autoDispose<
    CreateWFHNotifier, AsyncValue<WFHRequest?>>((ref) {
  return CreateWFHNotifier(ref.read(wfhRepositoryProvider), ref);
});

class CancelWFHNotifier extends StateNotifier<AsyncValue<void>> {
  final WFHRepository _repo;
  final Ref _ref;

  CancelWFHNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> cancel(String id) async {
    state = const AsyncLoading();
    try {
      await _repo.cancel(id);
      state = const AsyncData(null);
      _ref.invalidate(wfhListProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final cancelWFHProvider =
    StateNotifierProvider.autoDispose<CancelWFHNotifier, AsyncValue<void>>(
        (ref) {
  return CancelWFHNotifier(ref.read(wfhRepositoryProvider), ref);
});
