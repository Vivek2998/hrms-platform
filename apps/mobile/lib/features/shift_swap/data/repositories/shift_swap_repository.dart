import 'package:dio/dio.dart';
import '../models/shift_swap_model.dart';

class ShiftSwapRepository {
  final Dio _dio;
  ShiftSwapRepository({required Dio dio}) : _dio = dio;

  Future<List<ShiftSwapRequest>> getMyRequests() async {
    final res = await _dio.get('/shift-swaps', queryParameters: {'limit': 50});
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => ShiftSwapRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ShiftSwapRequest> create({
    required String targetEmployeeId,
    required String requesterDate,
    required String targetDate,
    String? reason,
  }) async {
    final res = await _dio.post('/shift-swaps', data: {
      'targetEmployeeId': targetEmployeeId,
      'requesterDate': requesterDate,
      'targetDate': targetDate,
      if (reason != null) 'reason': reason,
    });
    return ShiftSwapRequest.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> cancel(String id) async {
    await _dio.delete('/shift-swaps/$id');
  }
}
