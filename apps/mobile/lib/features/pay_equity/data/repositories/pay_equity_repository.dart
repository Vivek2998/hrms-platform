import 'package:dio/dio.dart';
import '../models/pay_equity_model.dart';

class PayEquityRepository {
  final Dio _dio;
  PayEquityRepository({required Dio dio}) : _dio = dio;

  Future<PayEquitySnapshot?> getLatest() async {
    final r = await _dio.get('/pay-equity/latest');
    final data = r.data['data'];
    if (data == null) return null;
    return PayEquitySnapshot.fromJson(data as Map<String, dynamic>);
  }
}
