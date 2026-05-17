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
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/leaves/presentation/pending_leaves_screen.dart';
import '../../features/team/presentation/team_screen.dart';
import '../../features/holidays/presentation/holidays_screen.dart';
import '../../features/documents/presentation/documents_screen.dart';
import '../../features/admin/presentation/employee_location_screen.dart';
import '../../features/helpdesk/presentation/helpdesk_screen.dart';
import '../../features/regularisation/presentation/regularisation_screen.dart';
import '../../features/comp_off/presentation/comp_off_screen.dart';
import '../../features/team/presentation/org_chart_screen.dart';
import '../../features/leaves/presentation/apply_leave_behalf_screen.dart';

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
      final mustChange = auth.valueOrNull?.user?.mustChangePassword ?? false;
      final loc = state.matchedLocation;
      final isAuthRoute = loc == '/login' || loc == '/change-password';

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && loc == '/login') {
        return mustChange ? '/change-password' : '/dashboard';
      }
      // Prevent skipping the forced password change on first login.
      if (isLoggedIn && mustChange && !isAuthRoute) return '/change-password';
      // Once password is changed, don't let the user navigate back to that screen.
      if (isLoggedIn && !mustChange && loc == '/change-password') return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/change-password',
        builder: (_, __) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/leaves/pending',
        builder: (_, __) => const PendingLeavesScreen(),
      ),
      GoRoute(
        path: '/team',
        builder: (_, __) => const TeamScreen(),
      ),
      GoRoute(
        path: '/holidays',
        builder: (_, __) => const HolidaysScreen(),
      ),
      GoRoute(
        path: '/documents',
        builder: (_, __) => const DocumentsScreen(),
      ),
      GoRoute(
        path: '/admin/employee-locations',
        builder: (_, __) => const EmployeeLocationScreen(),
      ),
      GoRoute(
        path: '/helpdesk',
        builder: (_, __) => const HelpdeskScreen(),
      ),
      GoRoute(
        path: '/regularisation',
        builder: (_, __) => const RegularisationScreen(),
      ),
      GoRoute(
        path: '/comp-off',
        builder: (_, __) => const CompOffScreen(),
      ),
      GoRoute(
        path: '/org-chart',
        builder: (_, __) => const OrgChartScreen(),
      ),
      GoRoute(
        path: '/leaves/apply-behalf',
        builder: (_, __) => const ApplyLeaveBehalfScreen(),
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
                builder: (_, state) => ApplyLeaveScreen(
                  preSelectedTypeId: state.uri.queryParameters['typeId'],
                ),
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
