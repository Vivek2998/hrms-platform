class RevisionEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String employeeCode;

  const RevisionEmployee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.employeeCode,
  });

  factory RevisionEmployee.fromJson(Map<String, dynamic> j) => RevisionEmployee(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        employeeCode: j['employeeCode'] as String,
      );

  String get fullName => '$firstName $lastName';
}

class SalaryRevisionProposal {
  final String id;
  final String employeeId;
  final double currentSalary;
  final double proposedSalary;
  final String status;
  final String? reason;
  final String? effectiveDate;
  final DateTime createdAt;
  final RevisionEmployee? employee;

  const SalaryRevisionProposal({
    required this.id,
    required this.employeeId,
    required this.currentSalary,
    required this.proposedSalary,
    required this.status,
    this.reason,
    this.effectiveDate,
    required this.createdAt,
    this.employee,
  });

  factory SalaryRevisionProposal.fromJson(Map<String, dynamic> j) =>
      SalaryRevisionProposal(
        id: j['id'] as String,
        employeeId: j['employeeId'] as String,
        currentSalary: (j['currentSalary'] as num).toDouble(),
        proposedSalary: (j['proposedSalary'] as num).toDouble(),
        status: j['status'] as String? ?? 'PENDING',
        reason: j['reason'] as String?,
        effectiveDate: j['effectiveDate'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
        employee: j['employee'] != null
            ? RevisionEmployee.fromJson(j['employee'] as Map<String, dynamic>)
            : null,
      );
}
