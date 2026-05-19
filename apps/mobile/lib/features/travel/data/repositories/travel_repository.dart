import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/travel_model.dart';

part 'travel_repository.g.dart';

@riverpod
TravelRepository travelRepository(TravelRepositoryRef ref) {
  return TravelRepository(ref.watch(dioClientProvider));
}

class TravelRepository {
  final Dio dio;
  TravelRepository(this.dio);

  Future<List<TravelRequest>> getRequests() async {
    final res = await dio.get('/travel');
    final list = res.data['data'] as List;
    return list.map((e) => TravelRequest.fromJson(e)).toList();
  }

  Future<void> createRequest({
    required String purpose,
    required String fromCity,
    required String toCity,
    required String departureDate,
    String? returnDate,
    String? travelMode,
    double? estimatedBudget,
    bool hotelRequired = false,
    bool advanceRequired = false,
    double? advanceAmount,
    String? notes,
  }) async {
    await dio.post('/travel', data: {
      'purpose': purpose,
      'fromCity': fromCity,
      'toCity': toCity,
      'departureDate': departureDate,
      if (returnDate != null) 'returnDate': returnDate,
      if (travelMode != null) 'travelMode': travelMode,
      if (estimatedBudget != null) 'estimatedBudget': estimatedBudget,
      'hotelRequired': hotelRequired,
      'advanceRequired': advanceRequired,
      if (advanceAmount != null) 'advanceAmount': advanceAmount,
      if (notes != null) 'notes': notes,
    });
  }

  Future<void> approveRequest(String id) async {
    await dio.patch('/travel/$id/approve');
  }

  Future<void> rejectRequest(String id, {String? reason}) async {
    await dio.patch('/travel/$id/reject', data: {
      if (reason != null) 'reason': reason,
    });
  }

  Future<void> cancelRequest(String id) async {
    await dio.delete('/travel/$id');
  }
}
