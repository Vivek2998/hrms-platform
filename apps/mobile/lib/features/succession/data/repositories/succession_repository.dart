import 'package:dio/dio.dart';
import '../models/succession_model.dart';

class SuccessionRepository {
  final Dio _dio;
  SuccessionRepository({required Dio dio}) : _dio = dio;

  Future<List<SuccessionPlan>> getPlans() async {
    final res = await _dio.get('/succession/plans');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => SuccessionPlan.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
