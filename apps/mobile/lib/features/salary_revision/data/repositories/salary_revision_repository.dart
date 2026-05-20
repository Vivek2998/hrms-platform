import 'package:dio/dio.dart';
import '../models/salary_revision_model.dart';

class SalaryRevisionRepository {
  final Dio _dio;
  SalaryRevisionRepository({required Dio dio}) : _dio = dio;

  Future<List<SalaryRevisionProposal>> getProposals() async {
    final res = await _dio.get('/salary-revision-proposals');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) =>
            SalaryRevisionProposal.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<SalaryRevisionProposal> create({
    required String employeeId,
    required double currentSalary,
    required double proposedSalary,
    String? effectiveDate,
    String? reason,
  }) async {
    final res = await _dio.post('/salary-revision-proposals', data: {
      'employeeId': employeeId,
      'currentSalary': currentSalary,
      'proposedSalary': proposedSalary,
      if (effectiveDate != null) 'effectiveDate': effectiveDate,
      if (reason != null) 'reason': reason,
    });
    return SalaryRevisionProposal.fromJson(
        res.data['data'] as Map<String, dynamic>);
  }

  Future<void> approve(String id) async {
    await _dio.patch('/salary-revision-proposals/$id/approve');
  }

  Future<void> reject(String id, {String? reason}) async {
    await _dio.patch('/salary-revision-proposals/$id/reject',
        data: {if (reason != null) 'reason': reason});
  }
}
