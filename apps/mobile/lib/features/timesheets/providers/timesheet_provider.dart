import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/timesheet_model.dart';
import '../data/repositories/timesheet_repository.dart';
import '../../../core/dio/dio_client.dart';

final timesheetRepositoryProvider = Provider<TimesheetRepository>((ref) {
  return TimesheetRepository(dio: ref.read(dioClientProvider));
});

final projectsProvider = FutureProvider.autoDispose<List<Project>>((ref) {
  return ref.read(timesheetRepositoryProvider).getProjects();
});

final selectedWeekStartProvider =
    StateProvider.autoDispose<String>((ref) {
  final now = DateTime.now();
  final day = now.weekday;
  final monday = now.subtract(Duration(days: day - 1));
  return '${monday.year}-${monday.month.toString().padLeft(2, '0')}-${monday.day.toString().padLeft(2, '0')}';
});

final timesheetEntriesProvider =
    FutureProvider.autoDispose<List<TimesheetEntry>>((ref) {
  final weekStart = ref.watch(selectedWeekStartProvider);
  return ref
      .read(timesheetRepositoryProvider)
      .getEntries(weekStart: weekStart);
});

class TimesheetNotifier extends StateNotifier<AsyncValue<void>> {
  final TimesheetRepository _repo;
  final Ref _ref;

  TimesheetNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<bool> upsertEntry({
    required String projectId,
    required String date,
    required double hours,
    required String weekStart,
  }) async {
    state = const AsyncLoading();
    try {
      await _repo.upsertEntry(
          projectId: projectId, date: date, hours: hours, weekStart: weekStart);
      state = const AsyncData(null);
      _ref.invalidate(timesheetEntriesProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }

  Future<bool> submitWeek(String weekStart) async {
    state = const AsyncLoading();
    try {
      await _repo.submitWeek(weekStart);
      state = const AsyncData(null);
      _ref.invalidate(timesheetEntriesProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final timesheetNotifierProvider =
    StateNotifierProvider.autoDispose<TimesheetNotifier, AsyncValue<void>>(
        (ref) =>
            TimesheetNotifier(ref.read(timesheetRepositoryProvider), ref));
