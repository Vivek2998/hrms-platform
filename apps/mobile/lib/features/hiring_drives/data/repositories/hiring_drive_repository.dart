import 'package:dio/dio.dart';
import '../models/hiring_drive_model.dart';

class HiringDriveRepository {
  final Dio _dio;
  HiringDriveRepository({required Dio dio}) : _dio = dio;

  Future<List<HiringDrive>> getDrives() async {
    final r = await _dio.get('/hiring-drives');
    return (r.data['data'] as List)
        .map((e) => HiringDrive.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
