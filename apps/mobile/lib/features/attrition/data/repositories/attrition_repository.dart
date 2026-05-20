import 'package:dio/dio.dart';
import '../models/attrition_model.dart';

class AttritionRepository {
  final Dio _dio;
  AttritionRepository({required Dio dio}) : _dio = dio;

  Future<List<AttritionScore>> getScores() async {
    final r = await _dio.get('/attrition');
    return (r.data['data'] as List)
        .map((e) => AttritionScore.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> computeScores() async {
    final r = await _dio.post('/attrition/compute');
    return r.data as Map<String, dynamic>;
  }
}
