import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/room_model.dart';
import '../data/repositories/room_repository.dart';

part 'room_provider.g.dart';

@riverpod
Future<List<MeetingRoom>> meetingRooms(MeetingRoomsRef ref) async {
  return ref.read(roomRepositoryProvider).getRooms();
}

@riverpod
Future<List<RoomBooking>> roomBookings(RoomBookingsRef ref, {String? date}) async {
  return ref.read(roomRepositoryProvider).getBookings(date: date);
}

@riverpod
class RoomNotifier extends _$RoomNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<bool> createBooking({
    required String roomId,
    required String title,
    required String startTime,
    required String endTime,
    required int attendees,
    String? notes,
  }) async {
    state = const AsyncLoading();
    try {
      await ref.read(roomRepositoryProvider).createBooking(
            roomId: roomId,
            title: title,
            startTime: startTime,
            endTime: endTime,
            attendees: attendees,
            notes: notes,
          );
      ref.invalidate(roomBookingsProvider);
      state = const AsyncData(null);
      return true;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      return false;
    }
  }

  Future<bool> cancelBooking(String id) async {
    state = const AsyncLoading();
    try {
      await ref.read(roomRepositoryProvider).cancelBooking(id);
      ref.invalidate(roomBookingsProvider);
      state = const AsyncData(null);
      return true;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      return false;
    }
  }

  Future<bool> createRoom({
    required String name,
    String? location,
    required int capacity,
    required List<String> amenities,
  }) async {
    state = const AsyncLoading();
    try {
      await ref.read(roomRepositoryProvider).createRoom(
            name: name,
            location: location,
            capacity: capacity,
            amenities: amenities,
          );
      ref.invalidate(meetingRoomsProvider);
      state = const AsyncData(null);
      return true;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      return false;
    }
  }

  Future<bool> deactivateRoom(String id) async {
    state = const AsyncLoading();
    try {
      await ref.read(roomRepositoryProvider).deactivateRoom(id);
      ref.invalidate(meetingRoomsProvider);
      state = const AsyncData(null);
      return true;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      return false;
    }
  }
}
