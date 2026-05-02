import 'package:isar/isar.dart';

part 'leave_model.g.dart';

@collection
class CachedLeaveRequest {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String leaveId;

  late String employeeId;
  late String organizationId;
  late String leaveTypeName;
  late String leaveTypeCode;
  late DateTime startDate;
  late DateTime endDate;
  late double totalDays;
  late String status; // PENDING, APPROVED, REJECTED, CANCELLED
  late String reason;
  String? remarks;
  late DateTime appliedAt;
  late DateTime cachedAt;
}

class LeaveBalance {
  final String leaveTypeId;
  final String leaveTypeName;
  final String leaveTypeCode;
  final double totalDays;
  final double usedDays;
  final double remainingDays;

  const LeaveBalance({
    required this.leaveTypeId,
    required this.leaveTypeName,
    required this.leaveTypeCode,
    required this.totalDays,
    required this.usedDays,
    required this.remainingDays,
  });

  factory LeaveBalance.fromJson(Map<String, dynamic> j) => LeaveBalance(
        leaveTypeId: j['leaveTypeId'] as String,
        leaveTypeName: (j['leaveType'] as Map<String, dynamic>)['name'] as String,
        leaveTypeCode: (j['leaveType'] as Map<String, dynamic>)['code'] as String,
        totalDays: (j['totalDays'] as num).toDouble(),
        usedDays: (j['usedDays'] as num).toDouble(),
        remainingDays: (j['remainingDays'] as num).toDouble(),
      );
}
