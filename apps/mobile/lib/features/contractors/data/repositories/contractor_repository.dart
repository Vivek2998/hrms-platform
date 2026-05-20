import 'package:dio/dio.dart';
import '../models/contractor_model.dart';

class ContractorRepository {
  final Dio _dio;
  ContractorRepository({required Dio dio}) : _dio = dio;

  Future<List<Contractor>> getContractors() async {
    final r = await _dio.get('/contractors');
    return (r.data['data'] as List)
        .map((e) => Contractor.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
