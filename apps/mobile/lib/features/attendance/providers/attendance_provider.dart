import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/attendance_model.dart';
import '../data/repositories/attendance_repository.dart';

part 'attendance_provider.g.dart';

@Riverpod(keepAlive: true)
Future<List<CachedAttendanceRecord>> attendanceList(
  AttendanceListRef ref, {
  int month = 0,
  int year = 0,
}) {
  return ref
      .read(attendanceRepositoryProvider)
      .getMyAttendance(month: month, year: year);
}

@riverpod
class PunchNotifier extends _$PunchNotifier {
  @override
  AsyncValue<Map<String, dynamic>?> build() => const AsyncData(null);

  Future<void> punchIn({
    required double latitude,
    required double longitude,
    String? selfieUrl,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(attendanceRepositoryProvider).punchIn(
            latitude: latitude,
            longitude: longitude,
            selfieUrl: selfieUrl,
          ),
    );
    ref.invalidate(attendanceListProvider);
  }

  Future<void> punchOut({
    required double latitude,
    required double longitude,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(attendanceRepositoryProvider).punchOut(
            latitude: latitude,
            longitude: longitude,
          ),
    );
    ref.invalidate(attendanceListProvider);
  }
}
