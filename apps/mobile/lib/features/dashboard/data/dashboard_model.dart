class BirthdayEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;
  final String? avatarUrl;
  // Stored as month (1-12) and day so client can recompute daysUntil live
  final int dobMonth;
  final int dobDay;

  const BirthdayEmployee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.dobMonth,
    required this.dobDay,
    this.designation,
    this.avatarUrl,
  });

  factory BirthdayEmployee.fromJson(Map<String, dynamic> json) {
    int dobM = 0;
    int dobD = 0;
    final dobRaw = json['dateOfBirth'];
    if (dobRaw != null) {
      final dob = DateTime.parse(dobRaw as String);
      dobM = dob.month;
      dobD = dob.day;
    } else {
      final days = (json['daysUntil'] as num?)?.toInt() ?? 0;
      final approxDate = DateTime.now().add(Duration(days: days));
      dobM = approxDate.month;
      dobD = approxDate.day;
    }
    return BirthdayEmployee(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      dobMonth: dobM,
      dobDay: dobD,
      designation: json['designation'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  int get daysUntil {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    var next = DateTime(now.year, dobMonth, dobDay);
    if (next.isBefore(today)) {
      next = DateTime(now.year + 1, dobMonth, dobDay);
    }
    return next.difference(today).inDays;
  }

  bool get isToday => daysUntil == 0;

  String get countdownLabel {
    final d = daysUntil;
    if (d == 0) return 'Today';
    if (d == 1) return 'Tomorrow';
    return 'In $d days';
  }

  String get fullName => '$firstName $lastName';
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'
          .toUpperCase();
}

class NewJoinee {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;
  final String? avatarUrl;
  final DateTime dateOfJoining;

  const NewJoinee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.dateOfJoining,
    this.designation,
    this.avatarUrl,
  });

  factory NewJoinee.fromJson(Map<String, dynamic> json) => NewJoinee(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        dateOfJoining: DateTime.parse(json['dateOfJoining'] as String),
        designation: json['designation'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
      );

  String get fullName => '$firstName $lastName';
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'
          .toUpperCase();
}

class WorkAnniversary {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;
  final String? avatarUrl;
  final int years;

  const WorkAnniversary({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.years,
    this.designation,
    this.avatarUrl,
  });

  factory WorkAnniversary.fromJson(Map<String, dynamic> json) => WorkAnniversary(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        years: (json['years'] as num).toInt(),
        designation: json['designation'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
      );

  String get fullName => '$firstName $lastName';
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'
          .toUpperCase();
}

class DashboardWidgets {
  final List<BirthdayEmployee> birthdays;
  final List<NewJoinee> newJoinees;
  final List<WorkAnniversary> workAnniversaries;
  final String quoteCategory;

  const DashboardWidgets({
    required this.birthdays,
    required this.newJoinees,
    required this.workAnniversaries,
    this.quoteCategory = 'default',
  });
}
