import 'package:isar/isar.dart';

part 'auth_model.g.dart';

@collection
class CachedUser {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String employeeId;

  late String organizationId;
  late String firstName;
  late String lastName;
  late String workEmail;
  late String employeeCode;
  late String role;
  String? avatarUrl;
  late bool mustChangePassword;
  late DateTime cachedAt;
}

class AuthState {
  final CachedUser? user;
  final bool isAuthenticated;
  final String? orgName;
  final String? orgLogoUrl;

  const AuthState({
    this.user,
    this.isAuthenticated = false,
    this.orgName,
    this.orgLogoUrl,
  });
  const AuthState.unauthenticated()
      : user = null,
        isAuthenticated = false,
        orgName = null,
        orgLogoUrl = null;
}
