class HiringDrive {
  final String id, name, status;
  final String? driveType, venue, description;
  final DateTime? driveDate;
  final int targetCount;
  final Map<String, dynamic>? count;

  HiringDrive({
    required this.id,
    required this.name,
    required this.status,
    this.driveType,
    this.venue,
    this.description,
    this.driveDate,
    required this.targetCount,
    this.count,
  });

  factory HiringDrive.fromJson(Map<String, dynamic> j) => HiringDrive(
        id: j['id'],
        name: j['name'],
        status: j['status'],
        driveType: j['driveType'],
        venue: j['venue'],
        description: j['description'],
        driveDate: j['driveDate'] != null ? DateTime.parse(j['driveDate']) : null,
        targetCount: j['targetCount'] ?? 0,
        count: j['_count'] as Map<String, dynamic>?,
      );

  int get candidateCount => (count?['candidates'] as int?) ?? 0;
}
