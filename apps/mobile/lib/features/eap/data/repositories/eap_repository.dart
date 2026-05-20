import 'package:dio/dio.dart';
import '../models/eap_model.dart';

class EapRepository {
  final Dio _dio;
  EapRepository({required Dio dio}) : _dio = dio;

  Future<List<EapResource>> getResources({String? category}) async {
    final r = await _dio.get(
      '/eap',
      queryParameters: category != null ? {'category': category} : null,
    );
    return (r.data['data'] as List)
        .map((e) => EapResource.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
