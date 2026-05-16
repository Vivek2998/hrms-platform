import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/holiday_model.dart';
import '../../../../core/dio/dio_client.dart';

part 'holiday_repository.g.dart';

@riverpod
HolidayRepository holidayRepository(HolidayRepositoryRef ref) =>
    HolidayRepository(dio: ref.read(dioClientProvider));

class HolidayRepository {
  final Dio _dio;
  const HolidayRepository({required Dio dio}) : _dio = dio;

  Future<List<Holiday>> getHolidays(int year) async {
    final res = await _dio.get(
      '/holidays',
      queryParameters: {'year': year},
    );
    return (res.data['data'] as List)
        .map((e) => Holiday.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
