class Contractor {
  final String id, name, status, contractType;
  final String? email, phone;
  final double? dailyRate;
  final List<dynamic> skills;
  final Map<String, dynamic>? count;

  Contractor({
    required this.id,
    required this.name,
    required this.status,
    required this.contractType,
    this.email,
    this.phone,
    this.dailyRate,
    required this.skills,
    this.count,
  });

  factory Contractor.fromJson(Map<String, dynamic> j) => Contractor(
        id: j['id'],
        name: j['name'],
        status: j['status'],
        contractType: j['contractType'] ?? 'INDIVIDUAL',
        email: j['email'],
        phone: j['phone'],
        dailyRate:
            j['dailyRate'] != null ? (j['dailyRate'] as num).toDouble() : null,
        skills: j['skills'] as List? ?? [],
        count: j['_count'] as Map<String, dynamic>?,
      );

  int get poCount => (count?['pos'] as int?) ?? 0;
}
