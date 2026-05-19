class AssetAssignee {
  final String id;
  final String firstName;
  final String lastName;
  final String employeeCode;
  final String? avatarUrl;

  const AssetAssignee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.employeeCode,
    this.avatarUrl,
  });

  factory AssetAssignee.fromJson(Map<String, dynamic> j) => AssetAssignee(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        employeeCode: j['employeeCode'] as String,
        avatarUrl: j['avatarUrl'] as String?,
      );

  String get fullName => '$firstName $lastName';
}

class AssetAssignment {
  final String id;
  final String assetId;
  final String employeeId;
  final DateTime assignedAt;
  final DateTime? returnedAt;
  final String? condition;
  final String? notes;
  final AssetAssignee? employee;

  const AssetAssignment({
    required this.id,
    required this.assetId,
    required this.employeeId,
    required this.assignedAt,
    this.returnedAt,
    this.condition,
    this.notes,
    this.employee,
  });

  factory AssetAssignment.fromJson(Map<String, dynamic> j) => AssetAssignment(
        id: j['id'] as String,
        assetId: j['assetId'] as String,
        employeeId: j['employeeId'] as String,
        assignedAt: DateTime.parse(j['assignedAt'] as String),
        returnedAt: j['returnedAt'] != null
            ? DateTime.parse(j['returnedAt'] as String)
            : null,
        condition: j['condition'] as String?,
        notes: j['notes'] as String?,
        employee: j['employee'] != null
            ? AssetAssignee.fromJson(j['employee'] as Map<String, dynamic>)
            : null,
      );
}

class Asset {
  final String id;
  final String name;
  final String category;
  final String? serialNumber;
  final String? brand;
  final String? model;
  final double? purchasePrice;
  final DateTime? warrantyExpiry;
  final String status;
  final String? notes;
  final String? imageUrl;
  final DateTime createdAt;
  final List<AssetAssignment> assignments;
  // For employee "my assets" view — may come flattened
  final DateTime? assignedAt;

  const Asset({
    required this.id,
    required this.name,
    required this.category,
    this.serialNumber,
    this.brand,
    this.model,
    this.purchasePrice,
    this.warrantyExpiry,
    required this.status,
    this.notes,
    this.imageUrl,
    required this.createdAt,
    required this.assignments,
    this.assignedAt,
  });

  factory Asset.fromJson(Map<String, dynamic> j) => Asset(
        id: j['id'] as String,
        name: j['name'] as String,
        category: j['category'] as String? ?? 'OTHER',
        serialNumber: j['serialNumber'] as String?,
        brand: j['brand'] as String?,
        model: j['model'] as String?,
        purchasePrice: j['purchasePrice'] != null
            ? (j['purchasePrice'] as num).toDouble()
            : null,
        warrantyExpiry: j['warrantyExpiry'] != null
            ? DateTime.parse(j['warrantyExpiry'] as String)
            : null,
        status: j['status'] as String,
        notes: j['notes'] as String?,
        imageUrl: j['imageUrl'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
        assignments: (j['assignments'] as List? ?? [])
            .map((e) => AssetAssignment.fromJson(e as Map<String, dynamic>))
            .toList(),
        assignedAt: j['assignedAt'] != null
            ? DateTime.parse(j['assignedAt'] as String)
            : null,
      );

  AssetAssignment? get currentAssignment =>
      assignments.where((a) => a.returnedAt == null).isNotEmpty
          ? assignments.firstWhere((a) => a.returnedAt == null)
          : null;
}

const kCategoryIcons = {
  'LAPTOP': '💻',
  'DESKTOP': '🖥️',
  'PHONE': '📱',
  'TABLET': '📱',
  'MONITOR': '🖥️',
  'KEYBOARD': '⌨️',
  'MOUSE': '🖱️',
  'HEADSET': '🎧',
  'CHAIR': '🪑',
  'DESK': '🪑',
  'ID_CARD': '🪪',
  'ACCESS_CARD': '🪪',
  'OTHER': '📦',
};

const kAssetStatusColors = {
  'AVAILABLE': 0xFF10B981,
  'ASSIGNED': 0xFF3B82F6,
  'UNDER_REPAIR': 0xFFF59E0B,
  'RETIRED': 0xFF6B7280,
  'LOST': 0xFFEF4444,
};
