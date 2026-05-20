class BenefitEnrollment {
  final String status;

  const BenefitEnrollment({required this.status});

  factory BenefitEnrollment.fromJson(Map<String, dynamic> j) =>
      BenefitEnrollment(status: j['status'] as String);
}

class BenefitPlan {
  final String id;
  final String name;
  final String type;
  final String? provider;
  final String? description;
  final double? employeeContribution;
  final double? employerContribution;
  final bool isActive;
  final BenefitEnrollment? myEnrollment;

  const BenefitPlan({
    required this.id,
    required this.name,
    required this.type,
    this.provider,
    this.description,
    this.employeeContribution,
    this.employerContribution,
    required this.isActive,
    this.myEnrollment,
  });

  factory BenefitPlan.fromJson(Map<String, dynamic> j) => BenefitPlan(
        id: j['id'] as String,
        name: j['name'] as String,
        type: j['type'] as String,
        provider: j['provider'] as String?,
        description: j['description'] as String?,
        employeeContribution: j['employeeContribution'] != null
            ? (j['employeeContribution'] as num).toDouble()
            : null,
        employerContribution: j['employerContribution'] != null
            ? (j['employerContribution'] as num).toDouble()
            : null,
        isActive: j['isActive'] as bool? ?? true,
        myEnrollment: j['myEnrollment'] != null
            ? BenefitEnrollment.fromJson(
                j['myEnrollment'] as Map<String, dynamic>)
            : null,
      );

  bool get isEnrolled => myEnrollment?.status == 'ENROLLED';
  bool get isWaived => myEnrollment?.status == 'WAIVED';
}
