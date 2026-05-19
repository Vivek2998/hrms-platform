class AnalyticsOverview {
  final int activeEmployees;
  final int newThisMonth;
  final int exitedThisMonth;
  final double attritionRate;

  const AnalyticsOverview({
    required this.activeEmployees,
    required this.newThisMonth,
    required this.exitedThisMonth,
    required this.attritionRate,
  });

  factory AnalyticsOverview.fromJson(Map<String, dynamic> j) => AnalyticsOverview(
        activeEmployees: (j['activeEmployees'] as num).toInt(),
        newThisMonth: (j['newThisMonth'] as num).toInt(),
        exitedThisMonth: (j['exitedThisMonth'] as num).toInt(),
        attritionRate: (j['attritionRate'] as num).toDouble(),
      );
}

class HeadcountPoint {
  final String month;
  final int count;

  const HeadcountPoint({required this.month, required this.count});

  factory HeadcountPoint.fromJson(Map<String, dynamic> j) => HeadcountPoint(
        month: j['month'] as String,
        count: (j['count'] as num).toInt(),
      );
}

class DepartmentBreakdown {
  final String department;
  final int count;

  const DepartmentBreakdown({required this.department, required this.count});

  factory DepartmentBreakdown.fromJson(Map<String, dynamic> j) => DepartmentBreakdown(
        department: j['department'] as String,
        count: (j['count'] as num).toInt(),
      );
}

class AttendanceSummary {
  final String status;
  final int count;

  const AttendanceSummary({required this.status, required this.count});

  factory AttendanceSummary.fromJson(Map<String, dynamic> j) => AttendanceSummary(
        status: j['status'] as String,
        count: (j['count'] as num).toInt(),
      );
}

class LeaveUtilization {
  final String leaveType;
  final double used;
  final double balance;

  const LeaveUtilization({
    required this.leaveType,
    required this.used,
    required this.balance,
  });

  factory LeaveUtilization.fromJson(Map<String, dynamic> j) => LeaveUtilization(
        leaveType: j['leaveType'] as String,
        used: (j['used'] as num).toDouble(),
        balance: (j['balance'] as num).toDouble(),
      );
}

class PayrollPoint {
  final String month;
  final double gross;
  final double net;

  const PayrollPoint({
    required this.month,
    required this.gross,
    required this.net,
  });

  factory PayrollPoint.fromJson(Map<String, dynamic> j) => PayrollPoint(
        month: j['month'] as String,
        gross: (j['gross'] as num).toDouble(),
        net: (j['net'] as num).toDouble(),
      );
}
