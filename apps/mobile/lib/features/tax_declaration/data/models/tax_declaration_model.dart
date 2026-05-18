class TaxDeclaration {
  final String id;
  final String employeeId;
  final String financialYear;
  final String regime; // OLD | NEW
  final String status; // DRAFT | SUBMITTED | VERIFIED

  // 80C
  final double ppf;
  final double epf;
  final double elss;
  final double lic;
  final double nsc;
  final double homeLoanPrincipal;
  final double tuitionFees;
  final double sukanyaSamriddhi;

  // 80D
  final double healthInsuranceSelf;
  final double healthInsuranceParents;

  // HRA
  final double rentPaid;
  final String? landlordPan;

  // Others
  final double npsEmployee;
  final double homeLoanInterest;
  final double savingsInterest;
  final Map<String, dynamic>? otherDeductions;

  final double totalDeclared;
  final DateTime? submittedAt;
  final DateTime? verifiedAt;
  final Map<String, dynamic>? employee;

  const TaxDeclaration({
    required this.id,
    required this.employeeId,
    required this.financialYear,
    required this.regime,
    required this.status,
    required this.ppf,
    required this.epf,
    required this.elss,
    required this.lic,
    required this.nsc,
    required this.homeLoanPrincipal,
    required this.tuitionFees,
    required this.sukanyaSamriddhi,
    required this.healthInsuranceSelf,
    required this.healthInsuranceParents,
    required this.rentPaid,
    this.landlordPan,
    required this.npsEmployee,
    required this.homeLoanInterest,
    required this.savingsInterest,
    this.otherDeductions,
    required this.totalDeclared,
    this.submittedAt,
    this.verifiedAt,
    this.employee,
  });

  factory TaxDeclaration.fromJson(Map<String, dynamic> j) => TaxDeclaration(
        id: j['id'] as String,
        employeeId: j['employeeId'] as String,
        financialYear: j['financialYear'] as String,
        regime: j['regime'] as String? ?? 'NEW',
        status: j['status'] as String? ?? 'DRAFT',
        ppf: _d(j['ppf']),
        epf: _d(j['epf']),
        elss: _d(j['elss']),
        lic: _d(j['lic']),
        nsc: _d(j['nsc']),
        homeLoanPrincipal: _d(j['homeLoanPrincipal']),
        tuitionFees: _d(j['tuitionFees']),
        sukanyaSamriddhi: _d(j['sukanyaSamriddhi']),
        healthInsuranceSelf: _d(j['healthInsuranceSelf']),
        healthInsuranceParents: _d(j['healthInsuranceParents']),
        rentPaid: _d(j['rentPaid']),
        landlordPan: j['landlordPan'] as String?,
        npsEmployee: _d(j['npsEmployee']),
        homeLoanInterest: _d(j['homeLoanInterest']),
        savingsInterest: _d(j['savingsInterest']),
        otherDeductions: j['otherDeductions'] as Map<String, dynamic>?,
        totalDeclared: _d(j['totalDeclared']),
        submittedAt:
            j['submittedAt'] != null ? DateTime.parse(j['submittedAt'] as String) : null,
        verifiedAt:
            j['verifiedAt'] != null ? DateTime.parse(j['verifiedAt'] as String) : null,
        employee: j['employee'] as Map<String, dynamic>?,
      );

  static double _d(dynamic v) => (v as num?)?.toDouble() ?? 0.0;

  // Section totals (mirrors API calculation)
  double get sec80C {
    final raw = ppf + epf + elss + lic + nsc + homeLoanPrincipal + tuitionFees + sukanyaSamriddhi;
    return raw.clamp(0, 150000);
  }

  double get sec80D => healthInsuranceSelf + healthInsuranceParents;
  double get hra => rentPaid;
  double get nps => npsEmployee.clamp(0, 50000);
  double get homeLoanInt => homeLoanInterest.clamp(0, 200000);
  double get savings => savingsInterest.clamp(0, 10000);

  double get calculatedTotal => sec80C + sec80D + hra + nps + homeLoanInt + savings;
}

String currentFinancialYear() {
  final now = DateTime.now();
  final startYear = now.month >= 4 ? now.year : now.year - 1;
  return '$startYear-${(startYear + 1).toString().substring(2)}';
}
