import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/posh_model.dart';
import '../data/repositories/posh_repository.dart';
import '../../../core/dio/dio_client.dart';

final poshRepositoryProvider = Provider<POSHRepository>((ref) {
  return POSHRepository(dio: ref.read(dioClientProvider));
});

final poshCasesProvider = FutureProvider.autoDispose<List<POSHCase>>((ref) {
  return ref.read(poshRepositoryProvider).getCases();
});

class POSHNotifier extends StateNotifier<AsyncValue<void>> {
  final POSHRepository _repo;
  final Ref _ref;

  POSHNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> create({
    required String description,
    bool isAnonymous = false,
    String? incidentDate,
  }) async {
    state = const AsyncLoading();
    try {
      await _repo.create(
          description: description,
          isAnonymous: isAnonymous,
          incidentDate: incidentDate);
      state = const AsyncData(null);
      _ref.invalidate(poshCasesProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }

  Future<bool> updateStatus(String id, String status) async {
    state = const AsyncLoading();
    try {
      await _repo.updateStatus(id, status);
      state = const AsyncData(null);
      _ref.invalidate(poshCasesProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }

  Future<bool> addUpdate(String id, String note) async {
    state = const AsyncLoading();
    try {
      await _repo.addUpdate(id, note);
      state = const AsyncData(null);
      _ref.invalidate(poshCasesProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final poshNotifierProvider =
    StateNotifierProvider.autoDispose<POSHNotifier, AsyncValue<void>>(
        (ref) => POSHNotifier(ref.read(poshRepositoryProvider), ref));
