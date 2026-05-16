class TeamMember {
  final String id;
  final String employeeCode;
  final String firstName;
  final String lastName;
  final String? designation;
  final String workEmail;
  final String? phone;
  final String? avatarUrl;
  final DateTime? dateOfJoining;
  final TeamDepartment? department;
  final TeamManager? manager;

  const TeamMember({
    required this.id,
    required this.employeeCode,
    required this.firstName,
    required this.lastName,
    this.designation,
    required this.workEmail,
    this.phone,
    this.avatarUrl,
    this.dateOfJoining,
    this.department,
    this.manager,
  });

  String get fullName => '$firstName $lastName';

  factory TeamMember.fromJson(Map<String, dynamic> json) => TeamMember(
        id: json['id'] as String,
        employeeCode: json['employeeCode'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        designation: json['designation'] as String?,
        workEmail: json['workEmail'] as String,
        phone: json['phone'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        dateOfJoining: json['dateOfJoining'] != null
            ? DateTime.parse(json['dateOfJoining'] as String)
            : null,
        department: json['department'] != null
            ? TeamDepartment.fromJson(
                json['department'] as Map<String, dynamic>)
            : null,
        manager: json['manager'] != null
            ? TeamManager.fromJson(json['manager'] as Map<String, dynamic>)
            : null,
      );
}

class TeamDepartment {
  final String id;
  final String name;

  const TeamDepartment({required this.id, required this.name});

  factory TeamDepartment.fromJson(Map<String, dynamic> json) =>
      TeamDepartment(id: json['id'] as String, name: json['name'] as String);
}

class TeamManager {
  final String id;
  final String firstName;
  final String lastName;

  const TeamManager(
      {required this.id, required this.firstName, required this.lastName});

  String get fullName => '$firstName $lastName';

  factory TeamManager.fromJson(Map<String, dynamic> json) => TeamManager(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
      );
}
