import 'package:dio/dio.dart';
import '../models/pip_model.dart';

class PIPRepository {
  final Dio _dio;
  PIPRepository({required Dio dio}) : _dio = dio;

  Future<List<PIP>> getPIPs() async {
    final res = await _dio.get('/pip');
    final data = res.data['data'] as List<dynamic>;
    return data.map((e) => PIP.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> addCheckIn(String id,
      {required String note, int? progressPct}) async {
    await _dio.post('/pip/$id/check-ins', data: {
      'note': note,
      if (progressPct != null) 'progressPct': progressPct,
    });
  }
}
