import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/room_model.dart';

part 'room_repository.g.dart';

@riverpod
RoomRepository roomRepository(RoomRepositoryRef ref) {
  final Dio dio = ref.read(dioClientProvider);
  return RoomRepository(dio);
}

class RoomRepository {
  final Dio _dio;
  RoomRepository(this._dio);

  Future<List<MeetingRoom>> getRooms() async {
    final res = await _dio.get('/rooms');
    final list = res.data['data'] as List;
    return list.map((e) => MeetingRoom.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<RoomBooking>> getBookings({String? date}) async {
    final res = await _dio.get('/rooms/bookings', queryParameters: date != null ? {'date': date} : null);
    final list = res.data['data'] as List;
    return list.map((e) => RoomBooking.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<MeetingRoom> createRoom({
    required String name,
    String? location,
    required int capacity,
    required List<String> amenities,
  }) async {
    final res = await _dio.post('/rooms', data: {
      'name': name,
      if (location != null) 'location': location,
      'capacity': capacity,
      'amenities': amenities,
    });
    return MeetingRoom.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<RoomBooking> createBooking({
    required String roomId,
    required String title,
    required String startTime,
    required String endTime,
    required int attendees,
    String? notes,
  }) async {
    final res = await _dio.post('/rooms/bookings', data: {
      'roomId': roomId,
      'title': title,
      'startTime': startTime,
      'endTime': endTime,
      'attendees': attendees,
      if (notes != null) 'notes': notes,
    });
    return RoomBooking.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> cancelBooking(String id) async {
    await _dio.delete('/rooms/bookings/$id');
  }

  Future<void> deactivateRoom(String id) async {
    await _dio.delete('/rooms/$id');
  }
}
