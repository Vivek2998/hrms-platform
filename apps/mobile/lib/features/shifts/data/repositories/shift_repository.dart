import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/shift_model.dart';
import '../../../../core/dio/dio_client.dart';

part 'shift_repository.g.dart';

@riverpod
ShiftRepository shiftRepository(ShiftRepositoryRef ref) =>
    ShiftRepository(dio: ref.read(dioClientProvider));

class ShiftRepository {
  final Dio _dio;
  ShiftRepository({required Dio dio}) : _dio = dio;

  Future<List<Shift>> getShifts() async {
    final res = await _dio.get('/shifts', queryParameters: {'limit': 100});
    final data = res.data['data'];
    final list = data is List ? data : (data as Map<String, dynamic>)['items'] as List;
    return list.map((e) => Shift.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ShiftAssignment>> getAssignments() async {
    final res = await _dio.get('/shifts/assignments', queryParameters: {'limit': 200});
    final data = res.data['data'];
    final list = data is List ? data : (data as Map<String, dynamic>)['items'] as List;
    return list.map((e) => ShiftAssignment.fromJson(e as Map<String, dynamic>)).toList();
  }
}
