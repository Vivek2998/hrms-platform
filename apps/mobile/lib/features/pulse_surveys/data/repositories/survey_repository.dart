import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/survey_model.dart';

part 'survey_repository.g.dart';

@riverpod
SurveyRepository surveyRepository(SurveyRepositoryRef ref) =>
    SurveyRepository(dio: ref.read(dioClientProvider));

class SurveyRepository {
  final Dio _dio;
  SurveyRepository({required Dio dio}) : _dio = dio;

  Future<List<Survey>> getSurveys() async {
    final res = await _dio.get('/surveys');
    return (res.data['data'] as List)
        .map((e) => Survey.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<SurveyDetail> getSurveyDetail(String id) async {
    final res = await _dio.get('/surveys/$id');
    return SurveyDetail.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<SurveyResults> getSurveyResults(String id) async {
    final res = await _dio.get('/surveys/$id/results');
    return SurveyResults.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> submitResponse(String surveyId, List<SurveyAnswer> answers) async {
    await _dio.post('/surveys/$surveyId/respond', data: {
      'answers': answers.map((a) => a.toJson()).toList(),
    });
  }

  Future<void> updateStatus(String surveyId, String status) async {
    await _dio.patch('/surveys/$surveyId/status', data: {'status': status});
  }
}
