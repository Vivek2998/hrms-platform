class EwaRequest {
  final String id;
  final String employeeId;
  final double amount;
  final String status;
  final DateTime requestedAt;
  final DateTime? processedAt;
  final String? rejectedReason;
  final String? notes;

  EwaRequest({required this.id, required this.employeeId, required this.amount, required this.status, required this.requestedAt, this.processedAt, this.rejectedReason, this.notes});

  factory EwaRequest.fromJson(Map<String, dynamic> j) => EwaRequest(
    id: j['id'], employeeId: j['employeeId'], amount: (j['amount'] as num).toDouble(),
    status: j['status'], requestedAt: DateTime.parse(j['requestedAt']),
    processedAt: j['processedAt'] != null ? DateTime.parse(j['processedAt']) : null,
    rejectedReason: j['rejectedReason'], notes: j['notes'],
  );
}
