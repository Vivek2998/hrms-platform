import 'package:dio/dio.dart';

class LettersRepository {
  final Dio _dio;
  LettersRepository({required Dio dio}) : _dio = dio;

  Future<Map<String, dynamic>> getExperienceLetterData() async {
    final res = await _dio.get('/letters/me/experience');
    return res.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getSalaryCertificateData() async {
    final res = await _dio.get('/letters/me/salary-certificate');
    return res.data['data'] as Map<String, dynamic>;
  }
}
