class ExpenseClaim {
  final String id;
  final String organizationId;
  final String employeeId;
  final String title;
  final String? description;
  final String category;
  final double amount;
  final String currency;
  final String? receiptUrl;
  final DateTime expenseDate;
  final String status;
  final String? reviewNote;
  final DateTime? reviewedAt;
  final DateTime? paidAt;
  final DateTime createdAt;

  const ExpenseClaim({
    required this.id,
    required this.organizationId,
    required this.employeeId,
    required this.title,
    this.description,
    required this.category,
    required this.amount,
    required this.currency,
    this.receiptUrl,
    required this.expenseDate,
    required this.status,
    this.reviewNote,
    this.reviewedAt,
    this.paidAt,
    required this.createdAt,
  });

  factory ExpenseClaim.fromJson(Map<String, dynamic> j) => ExpenseClaim(
        id: j['id'] as String,
        organizationId: j['organizationId'] as String,
        employeeId: j['employeeId'] as String,
        title: j['title'] as String,
        description: j['description'] as String?,
        category: j['category'] as String,
        amount: (j['amount'] as num).toDouble(),
        currency: j['currency'] as String? ?? 'INR',
        receiptUrl: j['receiptUrl'] as String?,
        expenseDate: DateTime.parse(j['expenseDate'] as String),
        status: j['status'] as String,
        reviewNote: j['reviewNote'] as String?,
        reviewedAt: j['reviewedAt'] != null
            ? DateTime.parse(j['reviewedAt'] as String)
            : null,
        paidAt:
            j['paidAt'] != null ? DateTime.parse(j['paidAt'] as String) : null,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );

  bool get isDraft => status == 'DRAFT';
  bool get isSubmitted => status == 'SUBMITTED';
  bool get isApproved => status == 'APPROVED';
  bool get isRejected => status == 'REJECTED';
  bool get isPaid => status == 'PAID';
}

const kCategoryLabels = {
  'TRAVEL': 'Travel',
  'FOOD': 'Food',
  'ACCOMMODATION': 'Accommodation',
  'COMMUNICATION': 'Communication',
  'TRAINING': 'Training',
  'EQUIPMENT': 'Equipment',
  'MEDICAL': 'Medical',
  'OTHER': 'Other',
};

const kExpenseCategories = [
  'TRAVEL',
  'FOOD',
  'ACCOMMODATION',
  'COMMUNICATION',
  'TRAINING',
  'EQUIPMENT',
  'MEDICAL',
  'OTHER',
];
