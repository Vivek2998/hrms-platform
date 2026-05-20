import 'package:dio/dio.dart';
import '../models/posh_model.dart';

class POSHRepository {
  final Dio _dio;
  POSHRepository({required Dio dio}) : _dio = dio;

  Future<List<POSHCase>> getCases() async {
    final res = await _dio.get('/posh/cases');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => POSHCase.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<POSHCase> create({
    required String description,
    bool isAnonymous = false,
    String? incidentDate,
  }) async {
    final res = await _dio.post('/posh/cases', data: {
      'description': description,
      'isAnonymous': isAnonymous,
      if (incidentDate != null) 'incidentDate': incidentDate,
    });
    return POSHCase.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> updateStatus(String id, String status) async {
    await _dio.patch('/posh/cases/$id/status', data: {'status': status});
  }

  Future<void> addUpdate(String id, String note) async {
    await _dio.post('/posh/cases/$id/updates', data: {'note': note});
  }
}
