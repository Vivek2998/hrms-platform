class WFHRequest {
  final String id;
  final String date;
  final String reason;
  final String status;
  final DateTime createdAt;
  final Map<String, dynamic>? approver;

  const WFHRequest({
    required this.id,
    required this.date,
    required this.reason,
    required this.status,
    required this.createdAt,
    this.approver,
  });

  factory WFHRequest.fromJson(Map<String, dynamic> json) => WFHRequest(
        id: json['id'] as String,
        date: json['date'] as String,
        reason: json['reason'] as String,
        status: json['status'] as String? ?? 'PENDING',
        createdAt: DateTime.parse(json['createdAt'] as String),
        approver: json['approver'] as Map<String, dynamic>?,
      );
}
