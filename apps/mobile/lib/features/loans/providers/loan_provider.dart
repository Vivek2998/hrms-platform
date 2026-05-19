import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/loan_model.dart';
import '../data/repositories/loan_repository.dart';

part 'loan_provider.g.dart';

@riverpod
Future<List<LoanRequest>> loanRequests(LoanRequestsRef ref) {
  return ref.watch(loanRepositoryProvider).getLoans();
}

@riverpod
class LoanNotifier extends _$LoanNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<bool> createLoan({
    required String loanType,
    required double amount,
    int? tenure,
    required String purpose,
    String? notes,
  }) async {
    state = const AsyncLoading();
    try {
      await ref.read(loanRepositoryProvider).createLoan(
            loanType: loanType,
            amount: amount,
            tenure: tenure,
            purpose: purpose,
            notes: notes,
          );
      ref.invalidate(loanRequestsProvider);
      state = const AsyncData(null);
      return true;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      return false;
    }
  }

  Future<bool> approveLoan(String id) async {
    try {
      await ref.read(loanRepositoryProvider).approveLoan(id);
      ref.invalidate(loanRequestsProvider);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> rejectLoan(String id, {String? reason}) async {
    try {
      await ref.read(loanRepositoryProvider).rejectLoan(id, reason: reason);
      ref.invalidate(loanRequestsProvider);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> disburseLoan(String id) async {
    try {
      await ref.read(loanRepositoryProvider).disburseLoan(id);
      ref.invalidate(loanRequestsProvider);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> cancelLoan(String id) async {
    try {
      await ref.read(loanRepositoryProvider).cancelLoan(id);
      ref.invalidate(loanRequestsProvider);
      return true;
    } catch (_) {
      return false;
    }
  }
}
