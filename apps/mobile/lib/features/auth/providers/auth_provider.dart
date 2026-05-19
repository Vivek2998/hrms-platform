import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/auth_model.dart';
import '../data/repositories/auth_repository.dart';
import '../../../core/providers/session_provider.dart';
import '../../../core/geofence/geofence_manager.dart';
import '../../../core/dio/dio_client.dart';
import '../../../core/notifications/fcm_service.dart';

part 'auth_provider.g.dart';

@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  Future<AuthState> build() async {
    // Listen for session expiry from the Dio interceptor.
    ref.listen(sessionExpiredProvider, (_, __) {
      state = const AsyncData(AuthState.unauthenticated());
    });

    final repo = ref.read(authRepositoryProvider);
    final user = await repo.getCachedUser();
    if (user == null) return const AuthState.unauthenticated();
    final branding = await repo.getOrgBranding();
    return AuthState(
      user: user,
      isAuthenticated: true,
      orgName: branding.orgName,
      orgLogoUrl: branding.orgLogoUrl,
    );
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(authRepositoryProvider);
      final user = await repo.login(email: email, password: password);
      final branding = await repo.getOrgBranding();
      // Register FCM token after successful login
      FcmService.registerToken(ref.read(dioClientProvider));
      return AuthState(
        user: user,
        isAuthenticated: true,
        orgName: branding.orgName,
        orgLogoUrl: branding.orgLogoUrl,
      );
    });
  }

  void markPasswordChanged() {
    final current = state.valueOrNull;
    if (current?.user == null) return;
    current!.user!.mustChangePassword = false;
    state = AsyncData(AuthState(user: current.user, isAuthenticated: true));
  }

  Future<void> logout() async {
    await GeofenceManager.instance.stop();
    // Remove FCM token from backend before clearing session
    await FcmService.removeToken(ref.read(dioClientProvider));
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(AuthState.unauthenticated());
  }
}
