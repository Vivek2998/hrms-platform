class EmployeeProfile {
  final String id;
  final String firstName;
  final String lastName;
  final String? avatarUrl;
  final String? phone;
  final String? designation;
  final String? departmentName;
  final String? bloodGroup;
  final String? maritalStatus;
  final DateTime? dateOfBirth;
  final DateTime? dateOfJoining;
  final String? bankName;
  final String? bankAccountNumber;
  final String? bankIfsc;
  final String? officeLocationName;

  const EmployeeProfile({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.avatarUrl,
    this.phone,
    this.designation,
    this.departmentName,
    this.bloodGroup,
    this.maritalStatus,
    this.dateOfBirth,
    this.dateOfJoining,
    this.bankName,
    this.bankAccountNumber,
    this.bankIfsc,
    this.officeLocationName,
  });

  factory EmployeeProfile.fromJson(Map<String, dynamic> j) {
    final dept = j['department'] as Map<String, dynamic>?;
    final loc = j['officeLocation'] as Map<String, dynamic>?;
    return EmployeeProfile(
      id: j['id'] as String,
      firstName: j['firstName'] as String,
      lastName: j['lastName'] as String,
      avatarUrl: j['avatarUrl'] as String?,
      phone: j['phone'] as String?,
      designation: j['designation'] as String?,
      departmentName: dept?['name'] as String?,
      bloodGroup: j['bloodGroup'] as String?,
      maritalStatus: j['maritalStatus'] as String?,
      dateOfBirth: j['dateOfBirth'] != null
          ? DateTime.parse(j['dateOfBirth'] as String)
          : null,
      dateOfJoining: j['dateOfJoining'] != null
          ? DateTime.parse(j['dateOfJoining'] as String)
          : null,
      bankName: j['bankName'] as String?,
      bankAccountNumber: j['bankAccountNumber'] as String?,
      bankIfsc: j['bankIfsc'] as String?,
      officeLocationName: loc?['name'] as String?,
    );
  }
}
