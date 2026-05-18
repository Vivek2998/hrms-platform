class BirthdayEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;
  final String? avatarUrl;
  final int daysUntil;

  const BirthdayEmployee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.daysUntil,
    this.designation,
    this.avatarUrl,
  });

  factory BirthdayEmployee.fromJson(Map<String, dynamic> json) =>
      BirthdayEmployee(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        daysUntil: (json['daysUntil'] as num).toInt(),
        designation: json['designation'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
      );

  bool get isToday => daysUntil == 0;

  String get countdownLabel {
    if (daysUntil == 0) return 'Today';
    if (daysUntil == 1) return 'Tomorrow';
    return 'In $daysUntil days';
  }

  String get fullName => '$firstName $lastName';
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'
          .toUpperCase();
}
