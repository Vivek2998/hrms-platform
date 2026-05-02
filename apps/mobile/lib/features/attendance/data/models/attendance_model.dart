import 'package:isar/isar.dart';

part 'attendance_model.g.dart';

@collection
class CachedAttendanceRecord {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String recordId;

  late String employeeId;
  late String organizationId;
  late DateTime date;
  late String status; // PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE, HOLIDAY, WEEKEND
  DateTime? punchIn;
  DateTime? punchOut;
  int? lateMinutes;
  int? workingMinutes;
  int? overtimeMinutes;
  late DateTime cachedAt;
}
