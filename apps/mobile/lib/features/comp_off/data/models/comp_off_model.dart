class CompOffRequest {
  final String id;
  final String workedDate;
  final String? requestedDate;
  final String reason;
  final String status;
  final DateTime createdAt;

  const CompOffRequest({
    required this.id,
    required this.workedDate,
    this.requestedDate,
    required this.reason,
    required this.status,
    required this.createdAt,
  });

  factory CompOffRequest.fromJson(Map<String, dynamic> json) => CompOffRequest(
        id: json['id'] as String,
        workedDate: json['workedDate'] as String,
        requestedDate: json['requestedDate'] as String?,
        reason: json['reason'] as String,
        status: json['status'] as String? ?? 'PENDING',
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
