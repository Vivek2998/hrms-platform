import 'package:isar/isar.dart';

part 'leave_model.g.dart';

/// A leave type as returned by GET /leave-types (not an Isar collection)
class ApiLeaveType {
  final String id;
  final String name;
  final String code;
  final int daysAllowed;
  final String colorHex;

  const ApiLeaveType({
    required this.id,
    required this.name,
    required this.code,
    required this.daysAllowed,
    required this.colorHex,
  });

  factory ApiLeaveType.fromJson(Map<String, dynamic> j) => ApiLeaveType(
        id: j['id'] as String,
        name: j['name'] as String,
        code: j['code'] as String,
        daysAllowed: (j['daysAllowed'] as num).toInt(),
        colorHex: (j['colorHex'] as String?) ?? '#6366f1',
      );

  bool get isHalfDay =>
      code == 'HDL' || name.toLowerCase().contains('half day');
}

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

/// A single pending leave request as returned by GET /leaves?status=PENDING (manager view)
class PendingLeaveRequest {
  final String id;
  final String employeeName;
  final String employeeCode;
  final String leaveTypeName;
  final String leaveTypeCode;
  final DateTime startDate;
  final DateTime endDate;
  final double totalDays;
  final String reason;
  final DateTime appliedAt;

  const PendingLeaveRequest({
    required this.id,
    required this.employeeName,
    required this.employeeCode,
    required this.leaveTypeName,
    required this.leaveTypeCode,
    required this.startDate,
    required this.endDate,
    required this.totalDays,
    required this.reason,
    required this.appliedAt,
  });

  factory PendingLeaveRequest.fromJson(Map<String, dynamic> j) {
    final emp = j['employee'] as Map<String, dynamic>;
    final lt = j['leaveType'] as Map<String, dynamic>;
    return PendingLeaveRequest(
      id: j['id'] as String,
      employeeName: '${emp['firstName']} ${emp['lastName']}',
      employeeCode: emp['employeeCode'] as String,
      leaveTypeName: lt['name'] as String,
      leaveTypeCode: lt['code'] as String,
      startDate: DateTime.parse(j['fromDate'] as String),
      endDate: DateTime.parse(j['toDate'] as String),
      totalDays: (j['totalDays'] as num).toDouble(),
      reason: j['reason'] as String,
      appliedAt: DateTime.parse(j['createdAt'] as String),
    );
  }
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
