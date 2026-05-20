class PIPEmployee {
  final String id;
  final String firstName;
  final String lastName;

  const PIPEmployee(
      {required this.id, required this.firstName, required this.lastName});

  factory PIPEmployee.fromJson(Map<String, dynamic> j) => PIPEmployee(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
      );

  String get fullName => '$firstName $lastName';
}

class PIPGoal {
  final String id;
  final String description;
  final bool isCompleted;

  const PIPGoal(
      {required this.id,
      required this.description,
      required this.isCompleted});

  factory PIPGoal.fromJson(Map<String, dynamic> j) => PIPGoal(
        id: j['id'] as String,
        description: j['description'] as String,
        isCompleted: j['isCompleted'] as bool? ?? false,
      );
}

class PIPCheckIn {
  final String id;
  final String note;
  final int? progressPct;
  final DateTime createdAt;

  const PIPCheckIn(
      {required this.id,
      required this.note,
      this.progressPct,
      required this.createdAt});

  factory PIPCheckIn.fromJson(Map<String, dynamic> j) => PIPCheckIn(
        id: j['id'] as String,
        note: j['note'] as String,
        progressPct: j['progressPct'] as int?,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}

class PIP {
  final String id;
  final String reason;
  final String status;
  final String startDate;
  final String endDate;
  final DateTime createdAt;
  final PIPEmployee? employee;
  final List<PIPGoal> goals;
  final List<PIPCheckIn> checkIns;

  const PIP({
    required this.id,
    required this.reason,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.createdAt,
    this.employee,
    required this.goals,
    required this.checkIns,
  });

  factory PIP.fromJson(Map<String, dynamic> j) => PIP(
        id: j['id'] as String,
        reason: j['reason'] as String,
        status: j['status'] as String? ?? 'ACTIVE',
        startDate: j['startDate'] as String,
        endDate: j['endDate'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
        employee: j['employee'] != null
            ? PIPEmployee.fromJson(j['employee'] as Map<String, dynamic>)
            : null,
        goals: (j['goals'] as List<dynamic>? ?? [])
            .map((e) => PIPGoal.fromJson(e as Map<String, dynamic>))
            .toList(),
        checkIns: (j['checkIns'] as List<dynamic>? ?? [])
            .map((e) => PIPCheckIn.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
