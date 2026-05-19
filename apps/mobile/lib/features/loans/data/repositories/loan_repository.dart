import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/loan_model.dart';

part 'loan_repository.g.dart';

@riverpod
LoanRepository loanRepository(LoanRepositoryRef ref) {
  return LoanRepository(ref.watch(dioClientProvider));
}

class LoanRepository {
  final Dio dio;
  LoanRepository(this.dio);

  Future<List<LoanRequest>> getLoans() async {
    final res = await dio.get('/loans');
    final list = res.data['data'] as List;
    return list.map((e) => LoanRequest.fromJson(e)).toList();
  }

  Future<void> createLoan({
    required String loanType,
    required double amount,
    int? tenure,
    required String purpose,
    String? notes,
  }) async {
    await dio.post('/loans', data: {
      'loanType': loanType,
      'amount': amount,
      if (tenure != null) 'tenure': tenure,
      'purpose': purpose,
      if (notes != null) 'notes': notes,
    });
  }

  Future<void> approveLoan(String id) async {
    await dio.patch('/loans/$id/approve');
  }

  Future<void> rejectLoan(String id, {String? reason}) async {
    await dio.patch('/loans/$id/reject', data: {
      if (reason != null) 'reason': reason,
    });
  }

  Future<void> disburseLoan(String id) async {
    await dio.patch('/loans/$id/disburse');
  }

  Future<void> closeLoan(String id) async {
    await dio.patch('/loans/$id/close');
  }

  Future<void> cancelLoan(String id) async {
    await dio.delete('/loans/$id');
  }
}
