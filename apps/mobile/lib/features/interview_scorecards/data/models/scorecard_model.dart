class InterviewScorecard {
  final String id, candidateName;
  final String? recommendation, notes;
  final double? overallRating;
  final List<dynamic> scores;
  final DateTime createdAt;

  InterviewScorecard({
    required this.id,
    required this.candidateName,
    this.recommendation,
    this.notes,
    this.overallRating,
    required this.scores,
    required this.createdAt,
  });

  factory InterviewScorecard.fromJson(Map<String, dynamic> j) =>
      InterviewScorecard(
        id: j['id'],
        candidateName: j['candidateName'],
        recommendation: j['recommendation'],
        notes: j['notes'],
        overallRating: j['overallRating'] != null
            ? (j['overallRating'] as num).toDouble()
            : null,
        scores: j['scores'] as List? ?? [],
        createdAt: DateTime.parse(j['createdAt']),
      );
}
