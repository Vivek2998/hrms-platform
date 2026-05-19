class LoanEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String employeeCode;

  const LoanEmployee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.employeeCode,
  });

  factory LoanEmployee.fromJson(Map<String, dynamic> j) => LoanEmployee(
        id: j['id'],
        firstName: j['firstName'],
        lastName: j['lastName'],
        employeeCode: j['employeeCode'],
      );

  String get fullName => '$firstName $lastName';
}

class LoanRequest {
  final String id;
  final String employeeId;
  final String loanType;
  final double amount;
  final int? tenure;
  final double? emi;
  final String purpose;
  final String status;
  final String? approvedAt;
  final String? rejectedReason;
  final String? disbursedAt;
  final double repaidAmount;
  final String? notes;
  final String createdAt;
  final LoanEmployee employee;

  const LoanRequest({
    required this.id,
    required this.employeeId,
    required this.loanType,
    required this.amount,
    this.tenure,
    this.emi,
    required this.purpose,
    required this.status,
    this.approvedAt,
    this.rejectedReason,
    this.disbursedAt,
    required this.repaidAmount,
    this.notes,
    required this.createdAt,
    required this.employee,
  });

  factory LoanRequest.fromJson(Map<String, dynamic> j) => LoanRequest(
        id: j['id'],
        employeeId: j['employeeId'],
        loanType: j['loanType'],
        amount: double.tryParse(j['amount'].toString()) ?? 0,
        tenure: j['tenure'] as int?,
        emi: j['emi'] != null ? double.tryParse(j['emi'].toString()) : null,
        purpose: j['purpose'],
        status: j['status'] ?? 'PENDING',
        approvedAt: j['approvedAt'],
        rejectedReason: j['rejectedReason'],
        disbursedAt: j['disbursedAt'],
        repaidAmount: double.tryParse(j['repaidAmount'].toString()) ?? 0,
        notes: j['notes'],
        createdAt: j['createdAt'],
        employee: LoanEmployee.fromJson(j['employee']),
      );

  bool get isPending => status == 'PENDING';
  bool get isApproved => status == 'APPROVED';
  bool get isDisbursed => status == 'DISBURSED';
}

const kLoanTypeLabels = {
  'PERSONAL_LOAN': 'Personal Loan',
  'SALARY_ADVANCE': 'Salary Advance',
  'VEHICLE_LOAN': 'Vehicle Loan',
  'HOME_LOAN': 'Home Loan',
  'EDUCATION_LOAN': 'Education Loan',
  'OTHER': 'Other',
};

const kLoanStatusColors = {
  'PENDING': 0xFFF59E0B,
  'APPROVED': 0xFF3B82F6,
  'REJECTED': 0xFFEF4444,
  'DISBURSED': 0xFF10B981,
  'CLOSED': 0xFF9CA3AF,
  'CANCELLED': 0xFF9CA3AF,
};
