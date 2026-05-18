import 'package:dio/dio.dart';
import '../models/comp_off_model.dart';

class CompOffRepository {
  final Dio _dio;
  CompOffRepository({required Dio dio}) : _dio = dio;

  Future<List<CompOffRequest>> getMyRequests() async {
    final res = await _dio.get(
      '/comp-offs',
      queryParameters: {'limit': 50},
    );
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => CompOffRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<CompOffRequest> create({
    required String workedDate,
    String? requestedDate,
    required String reason,
  }) async {
    final res = await _dio.post('/comp-offs', data: {
      'workedDate': workedDate,
      if (requestedDate != null) 'requestedDate': requestedDate,
      'reason': reason,
    });
    return CompOffRequest.fromJson(res.data['data'] as Map<String, dynamic>);
  }
}
