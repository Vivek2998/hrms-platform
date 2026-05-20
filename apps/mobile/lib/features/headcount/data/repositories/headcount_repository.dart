import 'package:dio/dio.dart';
import '../models/headcount_model.dart';

class HeadcountRepository {
  final Dio _dio;
  HeadcountRepository({required Dio dio}) : _dio = dio;

  Future<List<HeadcountPlan>> getPlans() async {
    final res = await _dio.get('/headcount/plans');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => HeadcountPlan.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<OpenPosition>> getPositions() async {
    final res = await _dio.get('/headcount/positions');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => OpenPosition.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
