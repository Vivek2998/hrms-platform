class EsopGrant {
  final String id, employeeId, status;
  final int options;
  final double strikePrice;
  final DateTime grantDate;
  final String? notes;
  final Map<String, dynamic>? employee;

  EsopGrant({
    required this.id,
    required this.employeeId,
    required this.status,
    required this.options,
    required this.strikePrice,
    required this.grantDate,
    this.notes,
    this.employee,
  });

  factory EsopGrant.fromJson(Map<String, dynamic> j) => EsopGrant(
        id: j['id'],
        employeeId: j['employeeId'],
        status: j['status'],
        options: j['options'] as int,
        strikePrice: (j['strikePrice'] as num).toDouble(),
        grantDate: DateTime.parse(j['grantDate']),
        notes: j['notes'],
        employee: j['employee'] as Map<String, dynamic>?,
      );

  String get fullName => employee != null
      ? '${employee!['firstName']} ${employee!['lastName']}'
      : 'My Grant';
}
