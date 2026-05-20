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
import '../../features/attendance/presentation/biometric_preference_screen.dart';
import '../../features/performance/presentation/performance_screen.dart';
import '../../features/tax_declaration/presentation/tax_declaration_screen.dart';
import '../../features/shifts/presentation/shift_schedule_screen.dart';
import '../../features/expenses/presentation/expenses_screen.dart';
import '../../features/approval_inbox/presentation/approval_inbox_screen.dart';
import '../../features/kudos/presentation/kudos_screen.dart';
import '../../features/esignature/presentation/esignature_screen.dart';
import '../../features/lms/presentation/lms_screen.dart';
import '../../features/analytics/presentation/analytics_screen.dart';
import '../../features/pulse_surveys/presentation/pulse_surveys_screen.dart';
import '../../features/recruitment/presentation/recruitment_screen.dart';
import '../../features/assets/presentation/assets_screen.dart';
import '../../features/travel/presentation/travel_screen.dart';
import '../../features/loans/presentation/loans_screen.dart';
import '../../features/rooms/presentation/rooms_screen.dart';
import '../../features/wfh/presentation/wfh_screen.dart';
import '../../features/shift_swap/presentation/shift_swap_screen.dart';
import '../../features/referrals/presentation/referrals_screen.dart';
import '../../features/fnf/presentation/fnf_screen.dart';
import '../../features/my_letters/presentation/my_letters_screen.dart';
import '../../features/ewa/presentation/ewa_screen.dart';
import '../../features/attrition/presentation/attrition_screen.dart';
import '../../features/biometric_devices/presentation/biometric_devices_screen.dart';
import '../../features/hiring_drives/presentation/hiring_drives_screen.dart';
import '../../features/pay_equity/presentation/pay_equity_screen.dart';
import '../../features/interview_scorecards/presentation/interview_scorecards_screen.dart';
import '../../features/resume_parse/presentation/resume_parse_screen.dart';
import '../../features/contractors/presentation/contractors_screen.dart';
import '../../features/esop/presentation/esop_screen.dart';
import '../../features/eap/presentation/eap_screen.dart';
import '../../features/benefits/presentation/benefits_screen.dart';
import '../../features/career/presentation/career_screen.dart';
import '../../features/chat/presentation/chat_screen.dart';
import '../../features/compliance/presentation/compliance_screen.dart';
import '../../features/headcount/presentation/headcount_screen.dart';
import '../../features/nine_box/presentation/nine_box_screen.dart';
import '../../features/pip/presentation/pip_screen.dart';
import '../../features/posh/presentation/posh_screen.dart';
import '../../features/salary_revision/presentation/salary_revision_screen.dart';
import '../../features/succession/presentation/succession_screen.dart';
import '../../features/timesheets/presentation/timesheets_screen.dart';

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
      GoRoute(
        path: '/biometric-preference',
        builder: (_, __) => const BiometricPreferenceScreen(),
      ),
      GoRoute(
        path: '/performance',
        builder: (_, __) => const PerformanceScreen(),
      ),
      GoRoute(
        path: '/tax-declaration',
        builder: (_, __) => const TaxDeclarationScreen(),
      ),
      GoRoute(
        path: '/shift-schedule',
        builder: (_, __) => const ShiftScheduleScreen(),
      ),
      GoRoute(
        path: '/expenses',
        builder: (_, __) => const ExpensesScreen(),
      ),
      GoRoute(
        path: '/approval-inbox',
        builder: (_, __) => const ApprovalInboxScreen(),
      ),
      GoRoute(
        path: '/kudos',
        builder: (_, __) => const KudosScreen(),
      ),
      GoRoute(
        path: '/esignatures',
        builder: (_, __) => const ESignatureScreen(),
      ),
      GoRoute(
        path: '/lms',
        builder: (_, __) => const LmsScreen(),
      ),
      GoRoute(
        path: '/analytics',
        builder: (_, __) => const AnalyticsScreen(),
      ),
      GoRoute(
        path: '/pulse-surveys',
        builder: (_, __) => const PulseSurveysScreen(),
      ),
      GoRoute(
        path: '/recruitment',
        builder: (_, __) => const RecruitmentScreen(),
      ),
      GoRoute(
        path: '/assets',
        builder: (_, __) => const AssetsScreen(),
      ),
      GoRoute(
        path: '/travel',
        builder: (_, __) => const TravelScreen(),
      ),
      GoRoute(
        path: '/loans',
        builder: (_, __) => const LoansScreen(),
      ),
      GoRoute(
        path: '/rooms',
        builder: (_, __) => const RoomsScreen(),
      ),
      GoRoute(
        path: '/wfh',
        builder: (_, __) => const WFHScreen(),
      ),
      GoRoute(
        path: '/shift-swap',
        builder: (_, __) => const ShiftSwapScreen(),
      ),
      GoRoute(
        path: '/referrals',
        builder: (_, __) => const ReferralsScreen(),
      ),
      GoRoute(
        path: '/fnf',
        builder: (_, __) => const FnFScreen(),
      ),
      GoRoute(
        path: '/my-letters',
        builder: (_, __) => const MyLettersScreen(),
      ),
      GoRoute(
        path: '/benefits',
        builder: (_, __) => const BenefitsScreen(),
      ),
      GoRoute(
        path: '/career-paths',
        builder: (_, __) => const CareerScreen(),
      ),
      GoRoute(
        path: '/chat',
        builder: (_, __) => const ChatScreen(),
      ),
      GoRoute(
        path: '/compliance',
        builder: (_, __) => const ComplianceScreen(),
      ),
      GoRoute(
        path: '/headcount',
        builder: (_, __) => const HeadcountScreen(),
      ),
      GoRoute(
        path: '/nine-box',
        builder: (_, __) => const NineBoxScreen(),
      ),
      GoRoute(
        path: '/pip',
        builder: (_, __) => const PIPScreen(),
      ),
      GoRoute(
        path: '/posh',
        builder: (_, __) => const POSHScreen(),
      ),
      GoRoute(
        path: '/salary-revision',
        builder: (_, __) => const SalaryRevisionScreen(),
      ),
      GoRoute(
        path: '/succession',
        builder: (_, __) => const SuccessionScreen(),
      ),
      GoRoute(
        path: '/timesheets',
        builder: (_, __) => const TimesheetsScreen(),
      ),
      GoRoute(path: '/ewa', builder: (_, __) => const EWAScreen()),
      GoRoute(path: '/attrition', builder: (_, __) => const AttritionScreen()),
      GoRoute(path: '/biometric-devices', builder: (_, __) => const BiometricDevicesScreen()),
      GoRoute(path: '/hiring-drives', builder: (_, __) => const HiringDrivesScreen()),
      GoRoute(path: '/pay-equity', builder: (_, __) => const PayEquityScreen()),
      GoRoute(path: '/interview-scorecards', builder: (_, __) => const InterviewScorecardsScreen()),
      GoRoute(path: '/resume-parse', builder: (_, __) => const ResumeParseScreen()),
      GoRoute(path: '/contractors', builder: (_, __) => const ContractorsScreen()),
      GoRoute(path: '/esop', builder: (_, __) => const EsopScreen()),
      GoRoute(path: '/eap', builder: (_, __) => const EapScreen()),
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
