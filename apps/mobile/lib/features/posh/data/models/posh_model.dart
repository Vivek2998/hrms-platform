class POSHCaseUpdate {
  final String id;
  final String note;
  final DateTime createdAt;

  const POSHCaseUpdate({
    required this.id,
    required this.note,
    required this.createdAt,
  });

  factory POSHCaseUpdate.fromJson(Map<String, dynamic> j) => POSHCaseUpdate(
        id: j['id'] as String,
        note: j['note'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}

class POSHCase {
  final String id;
  final String caseNumber;
  final String description;
  final String status;
  final bool isAnonymous;
  final String? incidentDate;
  final DateTime createdAt;
  final List<POSHCaseUpdate> updates;

  const POSHCase({
    required this.id,
    required this.caseNumber,
    required this.description,
    required this.status,
    required this.isAnonymous,
    this.incidentDate,
    required this.createdAt,
    required this.updates,
  });

  factory POSHCase.fromJson(Map<String, dynamic> j) => POSHCase(
        id: j['id'] as String,
        caseNumber: j['caseNumber'] as String,
        description: j['description'] as String,
        status: j['status'] as String? ?? 'OPEN',
        isAnonymous: j['isAnonymous'] as bool? ?? false,
        incidentDate: j['incidentDate'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
        updates: (j['updates'] as List<dynamic>? ?? [])
            .map((e) => POSHCaseUpdate.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
