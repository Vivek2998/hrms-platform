class SuccessionEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;

  const SuccessionEmployee({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.designation,
  });

  factory SuccessionEmployee.fromJson(Map<String, dynamic> j) =>
      SuccessionEmployee(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        designation: j['designation'] as String?,
      );

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName[0]}${lastName[0]}';
}

class SuccessorNomination {
  final String employeeId;
  final String readiness;
  final String? notes;
  final SuccessionEmployee? employee;

  const SuccessorNomination({
    required this.employeeId,
    required this.readiness,
    this.notes,
    this.employee,
  });

  factory SuccessorNomination.fromJson(Map<String, dynamic> j) =>
      SuccessorNomination(
        employeeId: j['employeeId'] as String,
        readiness: j['readiness'] as String,
        notes: j['notes'] as String?,
        employee: j['employee'] != null
            ? SuccessionEmployee.fromJson(
                j['employee'] as Map<String, dynamic>)
            : null,
      );
}

class SuccessionPlan {
  final String id;
  final String roleTitle;
  final bool isCritical;
  final String riskLevel;
  final String? notes;
  final List<SuccessorNomination> successors;

  const SuccessionPlan({
    required this.id,
    required this.roleTitle,
    required this.isCritical,
    required this.riskLevel,
    this.notes,
    required this.successors,
  });

  factory SuccessionPlan.fromJson(Map<String, dynamic> j) => SuccessionPlan(
        id: j['id'] as String,
        roleTitle: j['roleTitle'] as String,
        isCritical: j['isCritical'] as bool? ?? true,
        riskLevel: j['riskLevel'] as String? ?? 'MEDIUM',
        notes: j['notes'] as String?,
        successors: (j['successors'] as List<dynamic>? ?? [])
            .map((e) =>
                SuccessorNomination.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
