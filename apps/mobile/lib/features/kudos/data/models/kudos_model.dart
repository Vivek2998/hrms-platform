class KudosEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;
  final String? avatarUrl;
  final String employeeCode;

  const KudosEmployee({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.designation,
    this.avatarUrl,
    required this.employeeCode,
  });

  factory KudosEmployee.fromJson(Map<String, dynamic> j) => KudosEmployee(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        designation: j['designation'] as String?,
        avatarUrl: j['avatarUrl'] as String?,
        employeeCode: j['employeeCode'] as String,
      );

  String get initials => '${firstName[0]}${lastName[0]}';
  String get fullName => '$firstName $lastName';
}

class Kudos {
  final String id;
  final String organizationId;
  final String fromEmployeeId;
  final String toEmployeeId;
  final String category;
  final String message;
  final bool isPublic;
  final Map<String, List<String>> reactions;
  final DateTime createdAt;
  final KudosEmployee fromEmployee;
  final KudosEmployee toEmployee;

  const Kudos({
    required this.id,
    required this.organizationId,
    required this.fromEmployeeId,
    required this.toEmployeeId,
    required this.category,
    required this.message,
    required this.isPublic,
    required this.reactions,
    required this.createdAt,
    required this.fromEmployee,
    required this.toEmployee,
  });

  factory Kudos.fromJson(Map<String, dynamic> j) {
    final rawReactions = j['reactions'] as Map<String, dynamic>? ?? {};
    final reactions = rawReactions.map(
      (k, v) => MapEntry(k, (v as List).map((e) => e as String).toList()),
    );
    return Kudos(
      id: j['id'] as String,
      organizationId: j['organizationId'] as String,
      fromEmployeeId: j['fromEmployeeId'] as String,
      toEmployeeId: j['toEmployeeId'] as String,
      category: j['category'] as String,
      message: j['message'] as String,
      isPublic: j['isPublic'] as bool? ?? true,
      reactions: reactions,
      createdAt: DateTime.parse(j['createdAt'] as String),
      fromEmployee: KudosEmployee.fromJson(j['fromEmployee'] as Map<String, dynamic>),
      toEmployee: KudosEmployee.fromJson(j['toEmployee'] as Map<String, dynamic>),
    );
  }

  int get totalReactions => reactions.values.fold(0, (s, l) => s + l.length);
}

const kKudosCategories = [
  (value: 'TEAMWORK', label: 'Teamwork', emoji: '🤝'),
  (value: 'INNOVATION', label: 'Innovation', emoji: '💡'),
  (value: 'LEADERSHIP', label: 'Leadership', emoji: '🌟'),
  (value: 'CUSTOMER_FOCUS', label: 'Customer Focus', emoji: '🎯'),
  (value: 'GOING_ABOVE_AND_BEYOND', label: 'Above & Beyond', emoji: '🚀'),
  (value: 'PROBLEM_SOLVING', label: 'Problem Solving', emoji: '🔧'),
  (value: 'MENTORSHIP', label: 'Mentorship', emoji: '🎓'),
  (value: 'OTHER', label: 'Other', emoji: '👏'),
];

const kQuickReactions = ['👍', '❤️', '🎉', '🙌', '🔥'];

String kudosCategoryEmoji(String category) {
  return kKudosCategories
      .firstWhere((c) => c.value == category, orElse: () => (value: '', label: '', emoji: '👏'))
      .emoji;
}

String kudosCategoryLabel(String category) {
  return kKudosCategories
      .firstWhere((c) => c.value == category, orElse: () => (value: '', label: category, emoji: ''))
      .label;
}
