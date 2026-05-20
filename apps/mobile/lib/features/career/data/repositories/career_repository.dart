import 'package:dio/dio.dart';
import '../models/career_model.dart';

class CareerRepository {
  final Dio _dio;
  CareerRepository({required Dio dio}) : _dio = dio;

  Future<List<Designation>> getDesignations() async {
    final res = await _dio.get('/designations');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => Designation.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<CareerPath>> getCareerPaths() async {
    final res = await _dio.get('/career-paths');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => CareerPath.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
