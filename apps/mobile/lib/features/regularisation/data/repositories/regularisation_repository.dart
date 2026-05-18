import 'package:dio/dio.dart';
import '../models/regularisation_model.dart';

class RegularisationRepository {
  final Dio _dio;
  RegularisationRepository({required Dio dio}) : _dio = dio;

  Future<List<RegularisationRequest>> getMyRequests() async {
    final res = await _dio.get(
      '/regularisations',
      queryParameters: {'limit': 50},
    );
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => RegularisationRequest.fromJson(
            e as Map<String, dynamic>))
        .toList();
  }

  Future<RegularisationRequest> create({
    required String date,
    String? requestedIn,
    String? requestedOut,
    required String reason,
  }) async {
    final res = await _dio.post('/regularisations', data: {
      'date': date,
      if (requestedIn != null) 'requestedIn': requestedIn,
      if (requestedOut != null) 'requestedOut': requestedOut,
      'reason': reason,
    });
    return RegularisationRequest.fromJson(
        res.data['data'] as Map<String, dynamic>);
  }
}
