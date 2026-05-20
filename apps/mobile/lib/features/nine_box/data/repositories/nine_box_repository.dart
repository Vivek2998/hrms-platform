import 'package:dio/dio.dart';
import '../models/nine_box_model.dart';

class NineBoxRepository {
  final Dio _dio;
  NineBoxRepository({required Dio dio}) : _dio = dio;

  Future<NineBoxData> getData({String? cycleId}) async {
    final res = await _dio.get('/nine-box',
        queryParameters: {if (cycleId != null) 'cycleId': cycleId});
    return NineBoxData.fromJson(res.data['data'] as Map<String, dynamic>);
  }
}
