import 'package:dio/dio.dart';
import '../models/ewa_model.dart';

class EwaRepository {
  final Dio _dio;
  EwaRepository({required Dio dio}) : _dio = dio;

  Future<List<EwaRequest>> getMyRequests() async {
    final r = await _dio.get('/ewa/mine');
    return (r.data['data'] as List).map((e) => EwaRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<EwaRequest> createRequest(double amount, String? notes) async {
    final r = await _dio.post('/ewa', data: {'amount': amount, if (notes != null) 'notes': notes});
    return EwaRequest.fromJson(r.data['data'] as Map<String, dynamic>);
  }
}
