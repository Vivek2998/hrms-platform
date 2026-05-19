import 'package:dio/dio.dart';
import '../models/referral_model.dart';

class ReferralRepository {
  final Dio _dio;
  ReferralRepository({required Dio dio}) : _dio = dio;

  Future<List<EmployeeReferral>> getMyReferrals() async {
    final res = await _dio.get('/referrals', queryParameters: {'limit': 50});
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => EmployeeReferral.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<EmployeeReferral> create({
    required String candidateName,
    required String candidateEmail,
    String? candidatePhone,
    required String position,
    String? message,
  }) async {
    final res = await _dio.post('/referrals', data: {
      'candidateName': candidateName,
      'candidateEmail': candidateEmail,
      if (candidatePhone != null) 'candidatePhone': candidatePhone,
      'position': position,
      if (message != null) 'message': message,
    });
    return EmployeeReferral.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> withdraw(String id) async {
    await _dio.delete('/referrals/$id');
  }
}
