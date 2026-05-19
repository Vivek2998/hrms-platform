import 'package:dio/dio.dart';
import '../models/fnf_model.dart';

class FnFRepository {
  final Dio _dio;
  FnFRepository({required Dio dio}) : _dio = dio;

  Future<List<FnFSettlement>> getSettlements() async {
    final res = await _dio.get('/fnf', queryParameters: {'limit': 50});
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => FnFSettlement.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
