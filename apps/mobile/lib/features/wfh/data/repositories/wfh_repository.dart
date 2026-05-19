import 'package:dio/dio.dart';
import '../models/wfh_model.dart';

class WFHRepository {
  final Dio _dio;
  WFHRepository({required Dio dio}) : _dio = dio;

  Future<List<WFHRequest>> getMyRequests() async {
    final res = await _dio.get('/wfh', queryParameters: {'limit': 50});
    final data = res.data['data'] as List<dynamic>;
    return data.map((e) => WFHRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<WFHRequest> create({
    required String date,
    required String reason,
  }) async {
    final res = await _dio.post('/wfh', data: {'date': date, 'reason': reason});
    return WFHRequest.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> cancel(String id) async {
    await _dio.delete('/wfh/$id');
  }
}
