class ApprovalInboxItem {
  final String id;
  final String type;
  final String title;
  final String subtitle;
  final String employeeName;
  final String employeeId;
  final DateTime createdAt;
  final String status;
  final Map<String, dynamic> metadata;

  const ApprovalInboxItem({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.employeeName,
    required this.employeeId,
    required this.createdAt,
    required this.status,
    required this.metadata,
  });

  factory ApprovalInboxItem.fromJson(Map<String, dynamic> j) => ApprovalInboxItem(
        id: j['id'] as String,
        type: j['type'] as String,
        title: j['title'] as String,
        subtitle: j['subtitle'] as String,
        employeeName: j['employeeName'] as String,
        employeeId: j['employeeId'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
        status: j['status'] as String,
        metadata: j['metadata'] as Map<String, dynamic>? ?? {},
      );

  bool get canApprove => type != 'HELPDESK';
}

const kInboxTypeLabels = {
  'LEAVE': 'Leave',
  'EXPENSE': 'Expense',
  'REGULARISATION': 'Regularisation',
  'COMP_OFF': 'Comp-off',
  'HELPDESK': 'Helpdesk',
};
