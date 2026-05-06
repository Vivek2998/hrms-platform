import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/change_password_screen.dart';
import '../../features/dashboard/presentation/home_shell.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/attendance/presentation/attendance_screen.dart';
import '../../features/attendance/presentation/punch_in_screen.dart';
import '../../features/leaves/presentation/leaves_screen.dart';
import '../../features/leaves/presentation/apply_leave_screen.dart';
import '../../features/payslips/presentation/payslips_screen.dart';
import '../../features/payslips/presentation/payslip_detail_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';

part 'router.g.dart';

class _RouterNotifier extends ChangeNotifier {
  final Ref _ref;
  _RouterNotifier(this._ref) {
    _ref.listen(authNotifierProvider, (_, __) => notifyListeners());
  }
}

@riverpod
GoRouter router(RouterRef ref) {
  final notifier = _RouterNotifier(ref);
  return GoRouter(
    debugLogDiagnostics: false,
    refreshListenable: notifier,
    redirect: (context, state) {
      final auth = ref.read(authNotifierProvider);
      final isLoggedIn = auth.valueOrNull?.isAuthenticated ?? false;
      final loc = state.matchedLocation;
      final isAuthRoute = loc == '/login' || loc == '/change-password';
      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && loc == '/login') return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/change-password',
        builder: (_, __) => const ChangePasswordScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/attendance',
            builder: (_, __) => const AttendanceScreen(),
            routes: [
              GoRoute(
                path: 'punch',
                builder: (_, __) => const PunchInScreen(),
              ),
            ],
          ),
          GoRoute(
            path: '/leaves',
            builder: (_, __) => const LeavesScreen(),
            routes: [
              GoRoute(
                path: 'apply',
                builder: (_, __) => const ApplyLeaveScreen(),
              ),
            ],
          ),
          GoRoute(
            path: '/payslips',
            builder: (_, __) => const PayslipsScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (_, state) => PayslipDetailScreen(
                  payslipId: state.pathParameters['id']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
        ],
      ),
    ],
  );
}
