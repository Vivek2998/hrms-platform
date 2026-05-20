class ComplianceDeadline {
  final String type;
  final String description;
  final DateTime dueDate;

  const ComplianceDeadline({
    required this.type,
    required this.description,
    required this.dueDate,
  });

  factory ComplianceDeadline.fromJson(Map<String, dynamic> j) =>
      ComplianceDeadline(
        type: j['type'] as String,
        description: j['description'] as String,
        dueDate: DateTime.parse(j['dueDate'] as String),
      );

  bool get isOverdue => dueDate.isBefore(DateTime.now()) && !isToday;
  bool get isToday {
    final now = DateTime.now();
    return dueDate.year == now.year &&
        dueDate.month == now.month &&
        dueDate.day == now.day;
  }
}
