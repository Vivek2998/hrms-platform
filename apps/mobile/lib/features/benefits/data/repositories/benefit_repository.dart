import 'package:dio/dio.dart';
import '../models/benefit_model.dart';

class BenefitRepository {
  final Dio _dio;
  BenefitRepository({required Dio dio}) : _dio = dio;

  Future<List<BenefitPlan>> getPlans() async {
    final res = await _dio.get('/benefits');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => BenefitPlan.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> enroll(String planId, {bool waive = false}) async {
    await _dio.post('/benefits/$planId/enroll',
        data: {'action': waive ? 'waive' : 'enroll'});
  }
}
