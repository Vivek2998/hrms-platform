class ShiftSwapRequest {
  final String id;
  final String requesterDate;
  final String targetDate;
  final String? reason;
  final String status;
  final DateTime createdAt;
  final Map<String, dynamic>? requester;
  final Map<String, dynamic>? target;

  const ShiftSwapRequest({
    required this.id,
    required this.requesterDate,
    required this.targetDate,
    this.reason,
    required this.status,
    required this.createdAt,
    this.requester,
    this.target,
  });

  factory ShiftSwapRequest.fromJson(Map<String, dynamic> json) =>
      ShiftSwapRequest(
        id: json['id'] as String,
        requesterDate: json['requesterDate'] as String,
        targetDate: json['targetDate'] as String,
        reason: json['reason'] as String?,
        status: json['status'] as String? ?? 'PENDING_ACCEPTANCE',
        createdAt: DateTime.parse(json['createdAt'] as String),
        requester: json['requester'] as Map<String, dynamic>?,
        target: json['target'] as Map<String, dynamic>?,
      );
}
