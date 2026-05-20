import 'package:dio/dio.dart';
import '../models/esop_model.dart';

class EsopRepository {
  final Dio _dio;
  EsopRepository({required Dio dio}) : _dio = dio;

  Future<List<EsopGrant>> getMyGrants() async {
    final r = await _dio.get('/esop/mine');
    return (r.data['data'] as List)
        .map((e) => EsopGrant.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
