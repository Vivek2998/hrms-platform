class PerformanceCycle {
  final String id;
  final String name;
  final String frequency;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final int? goalCount;
  final int? reviewCount;

  const PerformanceCycle({
    required this.id,
    required this.name,
    required this.frequency,
    required this.status,
    required this.startDate,
    required this.endDate,
    this.goalCount,
    this.reviewCount,
  });

  factory PerformanceCycle.fromJson(Map<String, dynamic> j) => PerformanceCycle(
        id: j['id'] as String,
        name: j['name'] as String,
        frequency: j['frequency'] as String,
        status: j['status'] as String,
        startDate: DateTime.parse(j['startDate'] as String),
        endDate: DateTime.parse(j['endDate'] as String),
        goalCount: (j['_count'] as Map<String, dynamic>?)?['goals'] as int?,
        reviewCount: (j['_count'] as Map<String, dynamic>?)?['reviews'] as int?,
      );
}

class PerformanceGoal {
  final String id;
  final String cycleId;
  final String employeeId;
  final String title;
  final String? description;
  final String? targetValue;
  final int progress;
  final String status;
  final DateTime? dueDate;
  final Map<String, dynamic>? employee;

  const PerformanceGoal({
    required this.id,
    required this.cycleId,
    required this.employeeId,
    required this.title,
    this.description,
    this.targetValue,
    required this.progress,
    required this.status,
    this.dueDate,
    this.employee,
  });

  factory PerformanceGoal.fromJson(Map<String, dynamic> j) => PerformanceGoal(
        id: j['id'] as String,
        cycleId: j['cycleId'] as String,
        employeeId: j['employeeId'] as String,
        title: j['title'] as String,
        description: j['description'] as String?,
        targetValue: j['targetValue'] as String?,
        progress: j['progress'] as int? ?? 0,
        status: j['status'] as String,
        dueDate: j['dueDate'] != null ? DateTime.parse(j['dueDate'] as String) : null,
        employee: j['employee'] as Map<String, dynamic>?,
      );
}

class PerformanceReview {
  final String id;
  final String cycleId;
  final String employeeId;
  final String? reviewerId;
  final String status;
  final double? selfRating;
  final String? selfComments;
  final double? managerRating;
  final String? managerComments;
  final double? finalRating;
  final Map<String, dynamic>? employee;
  final Map<String, dynamic>? reviewer;

  const PerformanceReview({
    required this.id,
    required this.cycleId,
    required this.employeeId,
    this.reviewerId,
    required this.status,
    this.selfRating,
    this.selfComments,
    this.managerRating,
    this.managerComments,
    this.finalRating,
    this.employee,
    this.reviewer,
  });

  factory PerformanceReview.fromJson(Map<String, dynamic> j) => PerformanceReview(
        id: j['id'] as String,
        cycleId: j['cycleId'] as String,
        employeeId: j['employeeId'] as String,
        reviewerId: j['reviewerId'] as String?,
        status: j['status'] as String,
        selfRating: (j['selfRating'] as num?)?.toDouble(),
        selfComments: j['selfComments'] as String?,
        managerRating: (j['managerRating'] as num?)?.toDouble(),
        managerComments: j['managerComments'] as String?,
        finalRating: (j['finalRating'] as num?)?.toDouble(),
        employee: j['employee'] as Map<String, dynamic>?,
        reviewer: j['reviewer'] as Map<String, dynamic>?,
      );
}

class PeerFeedback {
  final String id;
  final String cycleId;
  final String fromId;
  final String toId;
  final double? rating;
  final String? strengths;
  final String? improvements;
  final Map<String, dynamic>? from;
  final Map<String, dynamic>? to;

  const PeerFeedback({
    required this.id,
    required this.cycleId,
    required this.fromId,
    required this.toId,
    this.rating,
    this.strengths,
    this.improvements,
    this.from,
    this.to,
  });

  factory PeerFeedback.fromJson(Map<String, dynamic> j) => PeerFeedback(
        id: j['id'] as String,
        cycleId: j['cycleId'] as String,
        fromId: j['fromId'] as String,
        toId: j['toId'] as String,
        rating: (j['rating'] as num?)?.toDouble(),
        strengths: j['strengths'] as String?,
        improvements: j['improvements'] as String?,
        from: j['from'] as Map<String, dynamic>?,
        to: j['to'] as Map<String, dynamic>?,
      );
}
