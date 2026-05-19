import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/travel_model.dart';
import '../data/repositories/travel_repository.dart';

part 'travel_provider.g.dart';

@riverpod
Future<List<TravelRequest>> travelRequests(TravelRequestsRef ref) {
  return ref.watch(travelRepositoryProvider).getRequests();
}

@riverpod
class TravelNotifier extends _$TravelNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<bool> createRequest({
    required String purpose,
    required String fromCity,
    required String toCity,
    required String departureDate,
    String? returnDate,
    String? travelMode,
    double? estimatedBudget,
    bool hotelRequired = false,
    bool advanceRequired = false,
    double? advanceAmount,
    String? notes,
  }) async {
    state = const AsyncLoading();
    try {
      await ref.read(travelRepositoryProvider).createRequest(
            purpose: purpose,
            fromCity: fromCity,
            toCity: toCity,
            departureDate: departureDate,
            returnDate: returnDate,
            travelMode: travelMode,
            estimatedBudget: estimatedBudget,
            hotelRequired: hotelRequired,
            advanceRequired: advanceRequired,
            advanceAmount: advanceAmount,
            notes: notes,
          );
      ref.invalidate(travelRequestsProvider);
      state = const AsyncData(null);
      return true;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      return false;
    }
  }

  Future<bool> approveRequest(String id) async {
    try {
      await ref.read(travelRepositoryProvider).approveRequest(id);
      ref.invalidate(travelRequestsProvider);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> rejectRequest(String id, {String? reason}) async {
    try {
      await ref.read(travelRepositoryProvider).rejectRequest(id, reason: reason);
      ref.invalidate(travelRequestsProvider);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> cancelRequest(String id) async {
    try {
      await ref.read(travelRepositoryProvider).cancelRequest(id);
      ref.invalidate(travelRequestsProvider);
      return true;
    } catch (_) {
      return false;
    }
  }
}
