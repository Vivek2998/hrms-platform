import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/ewa_model.dart';
import '../data/repositories/ewa_repository.dart';
import '../../../core/dio/dio_client.dart';

final ewaRepositoryProvider = Provider<EwaRepository>((ref) => EwaRepository(dio: ref.read(dioClientProvider)));

final ewaRequestsProvider = FutureProvider.autoDispose<List<EwaRequest>>((ref) =>
    ref.read(ewaRepositoryProvider).getMyRequests());

class EwaNotifier extends StateNotifier<AsyncValue<void>> {
  final EwaRepository _repo;
  final Ref _ref;
  EwaNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> createRequest(double amount, String? notes) async {
    state = const AsyncLoading();
    try {
      await _repo.createRequest(amount, notes);
      state = const AsyncData(null);
      _ref.invalidate(ewaRequestsProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final ewaNotifierProvider = StateNotifierProvider.autoDispose<EwaNotifier, AsyncValue<void>>(
    (ref) => EwaNotifier(ref.read(ewaRepositoryProvider), ref));
