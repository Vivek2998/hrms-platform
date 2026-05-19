class FnFSettlement {
  final String id;
  final String lastWorkingDate;
  final String status;
  final double basicAmount;
  final double leaveEncashment;
  final double gratuityAmount;
  final double bonusAmount;
  final double otherDeductions;
  final double netPayable;
  final int basicDays;
  final double pendingLeavesDays;
  final double gratuityYears;
  final String? notes;
  final Map<String, dynamic>? approvedBy;
  final String? approvedAt;

  const FnFSettlement({
    required this.id,
    required this.lastWorkingDate,
    required this.status,
    required this.basicAmount,
    required this.leaveEncashment,
    required this.gratuityAmount,
    required this.bonusAmount,
    required this.otherDeductions,
    required this.netPayable,
    required this.basicDays,
    required this.pendingLeavesDays,
    required this.gratuityYears,
    this.notes,
    this.approvedBy,
    this.approvedAt,
  });

  factory FnFSettlement.fromJson(Map<String, dynamic> json) => FnFSettlement(
        id: json['id'] as String,
        lastWorkingDate: json['lastWorkingDate'] as String,
        status: json['status'] as String? ?? 'DRAFT',
        basicAmount: (json['basicAmount'] as num?)?.toDouble() ?? 0,
        leaveEncashment: (json['leaveEncashment'] as num?)?.toDouble() ?? 0,
        gratuityAmount: (json['gratuityAmount'] as num?)?.toDouble() ?? 0,
        bonusAmount: (json['bonusAmount'] as num?)?.toDouble() ?? 0,
        otherDeductions: (json['otherDeductions'] as num?)?.toDouble() ?? 0,
        netPayable: (json['netPayable'] as num?)?.toDouble() ?? 0,
        basicDays: (json['basicDays'] as num?)?.toInt() ?? 0,
        pendingLeavesDays:
            (json['pendingLeavesDays'] as num?)?.toDouble() ?? 0,
        gratuityYears: (json['gratuityYears'] as num?)?.toDouble() ?? 0,
        notes: json['notes'] as String?,
        approvedBy: json['approvedBy'] as Map<String, dynamic>?,
        approvedAt: json['approvedAt'] as String?,
      );
}
