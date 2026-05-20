class HeadcountPlan {
  final String id;
  final String quarter;
  final int year;
  final int plannedHeadcount;
  final double? budget;
  final String? notes;

  const HeadcountPlan({
    required this.id,
    required this.quarter,
    required this.year,
    required this.plannedHeadcount,
    this.budget,
    this.notes,
  });

  factory HeadcountPlan.fromJson(Map<String, dynamic> j) => HeadcountPlan(
        id: j['id'] as String,
        quarter: j['quarter'] as String,
        year: j['year'] as int,
        plannedHeadcount: j['plannedHeadcount'] as int,
        budget: j['budget'] != null ? (j['budget'] as num).toDouble() : null,
        notes: j['notes'] as String?,
      );
}

class OpenPosition {
  final String id;
  final String title;
  final String status;
  final String? location;
  final String? type;
  final String? targetDate;

  const OpenPosition({
    required this.id,
    required this.title,
    required this.status,
    this.location,
    this.type,
    this.targetDate,
  });

  factory OpenPosition.fromJson(Map<String, dynamic> j) => OpenPosition(
        id: j['id'] as String,
        title: j['title'] as String,
        status: j['status'] as String? ?? 'OPEN',
        location: j['location'] as String?,
        type: j['type'] as String?,
        targetDate: j['targetDate'] as String?,
      );
}
