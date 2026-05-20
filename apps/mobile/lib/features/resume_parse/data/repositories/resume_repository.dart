import 'package:dio/dio.dart';
import '../models/resume_model.dart';

class ResumeRepository {
  final Dio _dio;
  ResumeRepository({required Dio dio}) : _dio = dio;

  Future<List<ParsedResume>> getResumes() async {
    final r = await _dio.get('/resume-parse');
    return (r.data['data'] as List)
        .map((e) => ParsedResume.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
