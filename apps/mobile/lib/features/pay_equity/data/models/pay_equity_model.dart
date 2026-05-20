class PayEquitySnapshot {
  final String id;
  final DateTime snapshotDate;
  final Map<String, dynamic> reportData;

  PayEquitySnapshot({
    required this.id,
    required this.snapshotDate,
    required this.reportData,
  });

  factory PayEquitySnapshot.fromJson(Map<String, dynamic> j) => PayEquitySnapshot(
        id: j['id'],
        snapshotDate: DateTime.parse(j['snapshotDate']),
        reportData: j['reportData'] as Map<String, dynamic>? ?? {},
      );

  double get genderGapPct =>
      (reportData['genderGapPct'] as num?)?.toDouble() ?? 0;
  int get totalEmployees => (reportData['totalEmployees'] as int?) ?? 0;
  Map<String, dynamic> get byGender =>
      reportData['byGender'] as Map<String, dynamic>? ?? {};
  Map<String, dynamic> get byDepartment =>
      reportData['byDepartment'] as Map<String, dynamic>? ?? {};
}
