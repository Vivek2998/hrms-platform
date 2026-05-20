import 'package:dio/dio.dart';
import '../models/scorecard_model.dart';

class ScorecardRepository {
  final Dio _dio;
  ScorecardRepository({required Dio dio}) : _dio = dio;

  Future<List<InterviewScorecard>> getScorecards() async {
    final r = await _dio.get('/interview-scorecards');
    return (r.data['data'] as List)
        .map((e) => InterviewScorecard.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
