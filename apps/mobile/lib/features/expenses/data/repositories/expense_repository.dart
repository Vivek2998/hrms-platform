import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/expense_model.dart';

part 'expense_repository.g.dart';

@riverpod
ExpenseRepository expenseRepository(ExpenseRepositoryRef ref) =>
    ExpenseRepository(dio: ref.read(dioClientProvider));

class ExpenseRepository {
  final Dio _dio;
  ExpenseRepository({required Dio dio}) : _dio = dio;

  Future<List<ExpenseClaim>> getMyExpenses() async {
    final res = await _dio.get('/expenses/my');
    final data = res.data['data'] as List;
    return data.map((e) => ExpenseClaim.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ExpenseClaim>> getAllExpenses({String? status}) async {
    final res = await _dio.get('/expenses', queryParameters: {
      if (status != null) 'status': status,
    });
    final data = res.data['data'] as List;
    return data.map((e) => ExpenseClaim.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ExpenseClaim> createExpense({
    required String title,
    String? description,
    required String category,
    required double amount,
    String currency = 'INR',
    String? receiptUrl,
    required String expenseDate,
  }) async {
    final res = await _dio.post('/expenses', data: {
      'title': title,
      if (description != null) 'description': description,
      'category': category,
      'amount': amount,
      'currency': currency,
      if (receiptUrl != null) 'receiptUrl': receiptUrl,
      'expenseDate': expenseDate,
    });
    return ExpenseClaim.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> submitExpense(String id) async {
    await _dio.patch('/expenses/$id/submit');
  }

  Future<void> deleteExpense(String id) async {
    await _dio.delete('/expenses/$id');
  }
}
