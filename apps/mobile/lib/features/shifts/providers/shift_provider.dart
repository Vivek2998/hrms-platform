import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/shift_model.dart';
import '../data/repositories/shift_repository.dart';

part 'shift_provider.g.dart';

@riverpod
Future<List<Shift>> shiftList(ShiftListRef ref) =>
    ref.read(shiftRepositoryProvider).getShifts();

@riverpod
Future<List<ShiftAssignment>> shiftAssignments(ShiftAssignmentsRef ref) =>
    ref.read(shiftRepositoryProvider).getAssignments();

@riverpod
Future<ShiftAssignment?> myShiftAssignment(
  MyShiftAssignmentRef ref,
  String employeeId,
) async {
  final assignments = await ref.watch(shiftAssignmentsProvider.future);
  // Return the most recent active assignment for this employee
  final mine = assignments
      .where((a) => a.employeeId == employeeId)
      .toList()
    ..sort((a, b) => b.effectiveFrom.compareTo(a.effectiveFrom));
  if (mine.isEmpty) return null;
  // Prefer active, fall back to most recent
  return mine.firstWhere((a) => a.isActive, orElse: () => mine.first);
}
