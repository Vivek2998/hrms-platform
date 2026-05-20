class AttritionScore {
  final String id, employeeId, riskLevel;
  final double riskScore;
  final Map<String, dynamic> factors;
  final DateTime computedAt;
  final Map<String, dynamic>? employee;

  AttritionScore({
    required this.id,
    required this.employeeId,
    required this.riskLevel,
    required this.riskScore,
    required this.factors,
    required this.computedAt,
    this.employee,
  });

  factory AttritionScore.fromJson(Map<String, dynamic> j) => AttritionScore(
        id: j['id'],
        employeeId: j['employeeId'],
        riskLevel: j['riskLevel'],
        riskScore: (j['riskScore'] as num).toDouble(),
        factors: j['factors'] as Map<String, dynamic>? ?? {},
        computedAt: DateTime.parse(j['computedAt']),
        employee: j['employee'] as Map<String, dynamic>?,
      );

  String get initials {
    final e = employee;
    if (e == null) return '??';
    return '${(e['firstName'] as String? ?? '?')[0]}${(e['lastName'] as String? ?? '?')[0]}'.toUpperCase();
  }

  String get fullName =>
      employee != null ? '${employee!['firstName']} ${employee!['lastName']}' : 'Unknown';
}
