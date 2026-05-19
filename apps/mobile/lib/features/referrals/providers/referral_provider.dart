import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/referral_model.dart';
import '../data/repositories/referral_repository.dart';
import '../../../core/dio/dio_client.dart';

final referralRepositoryProvider = Provider<ReferralRepository>((ref) {
  return ReferralRepository(dio: ref.read(dioClientProvider));
});

final referralListProvider =
    FutureProvider.autoDispose<List<EmployeeReferral>>((ref) {
  return ref.read(referralRepositoryProvider).getMyReferrals();
});

class CreateReferralNotifier
    extends StateNotifier<AsyncValue<EmployeeReferral?>> {
  final ReferralRepository _repo;
  final Ref _ref;

  CreateReferralNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> create({
    required String candidateName,
    required String candidateEmail,
    String? candidatePhone,
    required String position,
    String? message,
  }) async {
    state = const AsyncLoading();
    try {
      final result = await _repo.create(
        candidateName: candidateName,
        candidateEmail: candidateEmail,
        candidatePhone: candidatePhone,
        position: position,
        message: message,
      );
      state = AsyncData(result);
      _ref.invalidate(referralListProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final createReferralProvider = StateNotifierProvider.autoDispose<
    CreateReferralNotifier, AsyncValue<EmployeeReferral?>>((ref) {
  return CreateReferralNotifier(ref.read(referralRepositoryProvider), ref);
});

class WithdrawReferralNotifier extends StateNotifier<AsyncValue<void>> {
  final ReferralRepository _repo;
  final Ref _ref;

  WithdrawReferralNotifier(this._repo, this._ref)
      : super(const AsyncData(null));

  Future<bool> withdraw(String id) async {
    state = const AsyncLoading();
    try {
      await _repo.withdraw(id);
      state = const AsyncData(null);
      _ref.invalidate(referralListProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final withdrawReferralProvider =
    StateNotifierProvider.autoDispose<WithdrawReferralNotifier, AsyncValue<void>>(
        (ref) {
  return WithdrawReferralNotifier(
      ref.read(referralRepositoryProvider), ref);
});
