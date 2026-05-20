import 'package:dio/dio.dart';
import '../models/compliance_model.dart';

class ComplianceRepository {
  final Dio _dio;
  ComplianceRepository({required Dio dio}) : _dio = dio;

  Future<List<ComplianceDeadline>> getCalendar() async {
    final res = await _dio.get('/compliance/calendar');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) =>
            ComplianceDeadline.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
