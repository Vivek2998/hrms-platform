class EmployeeReferral {
  final String id;
  final String candidateName;
  final String candidateEmail;
  final String? candidatePhone;
  final String position;
  final String status;
  final String? message;
  final double? bonusAmount;
  final bool bonusPaid;
  final DateTime createdAt;
  final Map<String, dynamic>? referrer;

  const EmployeeReferral({
    required this.id,
    required this.candidateName,
    required this.candidateEmail,
    this.candidatePhone,
    required this.position,
    required this.status,
    this.message,
    this.bonusAmount,
    required this.bonusPaid,
    required this.createdAt,
    this.referrer,
  });

  factory EmployeeReferral.fromJson(Map<String, dynamic> json) =>
      EmployeeReferral(
        id: json['id'] as String,
        candidateName: json['candidateName'] as String,
        candidateEmail: json['candidateEmail'] as String,
        candidatePhone: json['candidatePhone'] as String?,
        position: json['position'] as String,
        status: json['status'] as String? ?? 'SUBMITTED',
        message: json['message'] as String?,
        bonusAmount: (json['bonusAmount'] as num?)?.toDouble(),
        bonusPaid: json['bonusPaid'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
        referrer: json['referrer'] as Map<String, dynamic>?,
      );
}
