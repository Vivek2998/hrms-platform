import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/expense_model.dart';
import '../data/repositories/expense_repository.dart';

part 'expense_provider.g.dart';

@riverpod
Future<List<ExpenseClaim>> myExpenses(MyExpensesRef ref) =>
    ref.read(expenseRepositoryProvider).getMyExpenses();

@riverpod
Future<List<ExpenseClaim>> allExpenses(
  AllExpensesRef ref, {
  String? status,
}) =>
    ref.read(expenseRepositoryProvider).getAllExpenses(status: status);

@riverpod
class ExpenseNotifier extends _$ExpenseNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> create({
    required String title,
    String? description,
    required String category,
    required double amount,
    String currency = 'INR',
    String? receiptUrl,
    required String expenseDate,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() =>
        ref.read(expenseRepositoryProvider).createExpense(
              title: title,
              description: description,
              category: category,
              amount: amount,
              currency: currency,
              receiptUrl: receiptUrl,
              expenseDate: expenseDate,
            ));
    if (!state.hasError) {
      ref.invalidate(myExpensesProvider);
      ref.invalidate(allExpensesProvider);
    }
  }

  Future<void> submit(String id) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(expenseRepositoryProvider).submitExpense(id));
    if (!state.hasError) {
      ref.invalidate(myExpensesProvider);
      ref.invalidate(allExpensesProvider);
    }
  }

  Future<void> delete(String id) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(expenseRepositoryProvider).deleteExpense(id));
    if (!state.hasError) {
      ref.invalidate(myExpensesProvider);
      ref.invalidate(allExpensesProvider);
    }
  }
}
