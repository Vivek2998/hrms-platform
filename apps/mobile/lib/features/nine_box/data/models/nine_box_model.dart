class NineBoxEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;

  const NineBoxEmployee(
      {required this.id,
      required this.firstName,
      required this.lastName,
      this.designation});

  factory NineBoxEmployee.fromJson(Map<String, dynamic> j) => NineBoxEmployee(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        designation: j['designation'] as String?,
      );

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName[0]}${lastName[0]}';
}

class NineBoxAssessment {
  final String id;
  final int performance;
  final int potential;
  final String? notes;
  final String cycleId;
  final NineBoxEmployee? employee;

  const NineBoxAssessment({
    required this.id,
    required this.performance,
    required this.potential,
    this.notes,
    required this.cycleId,
    this.employee,
  });

  factory NineBoxAssessment.fromJson(Map<String, dynamic> j) =>
      NineBoxAssessment(
        id: j['id'] as String,
        performance: j['performance'] as int,
        potential: j['potential'] as int,
        notes: j['notes'] as String?,
        cycleId: j['cycleId'] as String,
        employee: j['employee'] != null
            ? NineBoxEmployee.fromJson(j['employee'] as Map<String, dynamic>)
            : null,
      );

  String get boxLabel => boxLabels['$performance-$potential'] ?? '';

  static const boxLabels = {
    '1-1': 'Underperformer', '2-1': 'Inconsistent Player',
    '3-1': 'High Professional', '1-2': 'Core Player',
    '2-2': 'Core Player', '3-2': 'High Performer',
    '1-3': 'Rising Star', '2-3': 'High Potential', '3-3': 'Star',
  };
}

class NineBoxData {
  final List<NineBoxAssessment> assessments;
  final Map<String, List<NineBoxAssessment>> grid;

  const NineBoxData({required this.assessments, required this.grid});

  factory NineBoxData.fromJson(Map<String, dynamic> j) {
    final assessments = (j['assessments'] as List<dynamic>? ?? [])
        .map((e) => NineBoxAssessment.fromJson(e as Map<String, dynamic>))
        .toList();
    final rawGrid = j['grid'] as Map<String, dynamic>? ?? {};
    final grid = rawGrid.map((k, v) => MapEntry(
          k,
          (v as List<dynamic>)
              .map((e) => NineBoxAssessment.fromJson(e as Map<String, dynamic>))
              .toList(),
        ));
    return NineBoxData(assessments: assessments, grid: grid);
  }
}
