import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/auth_model.dart';
import '../data/repositories/auth_repository.dart';
import '../../../core/providers/session_provider.dart';

part 'auth_provider.g.dart';

@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  Future<AuthState> build() async {
    // Listen for session expiry from the Dio interceptor.
    ref.listen(sessionExpiredProvider, (_, __) {
      state = const AsyncData(AuthState.unauthenticated());
    });

    final user = await ref.read(authRepositoryProvider).getCachedUser();
    if (user == null) return const AuthState.unauthenticated();
    return AuthState(user: user, isAuthenticated: true);
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final user = await ref
          .read(authRepositoryProvider)
          .login(email: email, password: password);
      return AuthState(user: user, isAuthenticated: true);
    });
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(AuthState.unauthenticated());
  }
}
