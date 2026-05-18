class RegularisationRequest {
  final String id;
  final String date;
  final String? requestedIn;
  final String? requestedOut;
  final String reason;
  final String status;
  final DateTime createdAt;

  const RegularisationRequest({
    required this.id,
    required this.date,
    this.requestedIn,
    this.requestedOut,
    required this.reason,
    required this.status,
    required this.createdAt,
  });

  factory RegularisationRequest.fromJson(Map<String, dynamic> json) =>
      RegularisationRequest(
        id: json['id'] as String,
        date: json['date'] as String,
        requestedIn: json['requestedIn'] as String?,
        requestedOut: json['requestedOut'] as String?,
        reason: json['reason'] as String,
        status: json['status'] as String? ?? 'PENDING',
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
