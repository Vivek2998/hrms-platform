import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { AuthGuard } from '@/components/guards/AuthGuard';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { SuperAdminGuard } from '@/components/guards/SuperAdminGuard';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/components/ui/page-loader';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const EmployeesPage = lazy(() => import('@/pages/employees/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('@/pages/employees/EmployeeDetailPage'));
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'));
const LeavesPage = lazy(() => import('@/pages/leaves/LeavesPage'));
const PayrollPage = lazy(() => import('@/pages/payroll/PayrollPage'));
const DepartmentsPage = lazy(() => import('@/pages/departments/DepartmentsPage'));
const ShiftsPage = lazy(() => import('@/pages/shifts/ShiftsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const HolidaysPage = lazy(() => import('@/pages/holidays/HolidaysPage'));
const MyLeavesPage = lazy(() => import('@/pages/my-leaves/MyLeavesPage'));
const RegularisationPage = lazy(() => import('@/pages/regularisation/RegularisationPage'));
const CompOffPage = lazy(() => import('@/pages/comp-off/CompOffPage'));
const TaxDeclarationPage = lazy(() => import('@/pages/tax-declaration/TaxDeclarationPage'));
const DirectoryPage = lazy(() => import('@/pages/directory/DirectoryPage'));
const OrgChartPage = lazy(() => import('@/pages/org-chart/OrgChartPage'));
const SuggestionBoxPage = lazy(() => import('@/pages/suggestions/SuggestionBoxPage'));
const HRPolicyPage = lazy(() => import('@/pages/hr-policy/HRPolicyPage'));
const HelpDeskPage = lazy(() => import('@/pages/helpdesk/HelpDeskPage'));
const MyPayslipsPage = lazy(() => import('@/pages/my-payslips/MyPayslipsPage'));
const PulseSurveyPage = lazy(() => import('@/pages/pulse-surveys/PulseSurveyPage'));
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'));
const PerformancePage = lazy(() => import('@/pages/performance/PerformancePage'));
const RecruitmentPage = lazy(() => import('@/pages/recruitment/RecruitmentPage'));
const OffboardingPage = lazy(() => import('@/pages/offboarding/OffboardingPage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const SalaryStructurePage = lazy(() => import('@/pages/salary/SalaryStructurePage'));
const AnnouncementsPage = lazy(() => import('@/pages/announcements/AnnouncementsPage'));
const OfficeLocationsPage = lazy(() => import('@/pages/office-locations/OfficeLocationsPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const SuperAdminLoginPage = lazy(() => import('@/pages/super-admin/SuperAdminLoginPage'));
const SuperAdminDashboard = lazy(() => import('@/pages/super-admin/SuperAdminDashboard'));
const ExpensesPage = lazy(() => import('@/pages/expenses/ExpensesPage'));
const ApprovalInboxPage = lazy(() => import('@/pages/approval-inbox/ApprovalInboxPage'));
const KudosPage = lazy(() => import('@/pages/kudos/KudosPage'));
const ESignaturePage = lazy(() => import('@/pages/esignature/ESignaturePage'));
const LmsPage = lazy(() => import('@/pages/lms/LmsPage'));
const AssetsPage = lazy(() => import('@/pages/assets/AssetsPage'));
const TravelPage = lazy(() => import('@/pages/travel/TravelPage'));
const LoansPage = lazy(() => import('@/pages/loans/LoansPage'));
const RoomsPage = lazy(() => import('@/pages/rooms/RoomsPage'));
const MyLettersPage = lazy(() => import('@/pages/my-letters/MyLettersPage'));
const WFHPage = lazy(() => import('@/pages/wfh/WFHPage'));
const ShiftSwapPage = lazy(() => import('@/pages/shift-swap/ShiftSwapPage'));
const ReferralPage = lazy(() => import('@/pages/referrals/ReferralPage'));
const FnFPage = lazy(() => import('@/pages/fnf/FnFPage'));
const SalaryRevisionPage = lazy(() => import('@/pages/salary-revision/SalaryRevisionPage'));
const CompliancePage = lazy(() => import('@/pages/compliance/CompliancePage'));
const POSHPage = lazy(() => import('@/pages/posh/POSHPage'));
const TimesheetPage = lazy(() => import('@/pages/timesheets/TimesheetPage'));
const BenefitsPage = lazy(() => import('@/pages/benefits/BenefitsPage'));
const PIPPage = lazy(() => import('@/pages/pip/PIPPage'));
const NineBoxPage = lazy(() => import('@/pages/nine-box/NineBoxPage'));
const HeadcountPage = lazy(() => import('@/pages/headcount/HeadcountPage'));
const CareerPage = lazy(() => import('@/pages/career/CareerPage'));
const SuccessionPage = lazy(() => import('@/pages/succession/SuccessionPage'));
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'));
const EWAPage = lazy(() => import('@/pages/ewa/EWAPage'));
const AttritionPage = lazy(() => import('@/pages/attrition/AttritionPage'));
const BiometricDevicesPage = lazy(() => import('@/pages/biometric-devices/BiometricDevicesPage'));
const HiringDrivesPage = lazy(() => import('@/pages/hiring-drives/HiringDrivesPage'));
const PayEquityPage = lazy(() => import('@/pages/pay-equity/PayEquityPage'));
const InterviewScorecardsPage = lazy(() => import('@/pages/interview-scorecards/InterviewScorecardsPage'));
const ResumeParsePage = lazy(() => import('@/pages/resume-parse/ResumeParsePage'));
const ContractorsPage = lazy(() => import('@/pages/contractors/ContractorsPage'));
const ESOPPage = lazy(() => import('@/pages/esop/ESOPPage'));
const EAPPage = lazy(() => import('@/pages/eap/EAPPage'));

function Lazy({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Lazy>
        <LoginPage />
      </Lazy>
    ),
  },
  {
    path: '/register',
    element: (
      <Lazy>
        <RegisterPage />
      </Lazy>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Lazy>
        <ResetPasswordPage />
      </Lazy>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Lazy>
            <DashboardPage />
          </Lazy>
        ),
      },
      {
        path: 'employees',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER']}>
            <Lazy>
              <EmployeesPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'employees/:id',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER']}>
            <Lazy>
              <EmployeeDetailPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'attendance',
        element: (
          <Lazy>
            <AttendancePage />
          </Lazy>
        ),
      },
      {
        path: 'leaves',
        element: (
          <Lazy>
            <LeavesPage />
          </Lazy>
        ),
      },
      {
        path: 'payroll',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <PayrollPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'salary-structure',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <SalaryStructurePage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'departments',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <DepartmentsPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'shifts',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <ShiftsPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'holidays',
        element: (
          <Lazy>
            <HolidaysPage />
          </Lazy>
        ),
      },
      {
        path: 'my-leaves',
        element: (
          <Lazy>
            <MyLeavesPage />
          </Lazy>
        ),
      },
      {
        path: 'regularisation',
        element: (
          <Lazy>
            <RegularisationPage />
          </Lazy>
        ),
      },
      {
        path: 'comp-off',
        element: (
          <Lazy>
            <CompOffPage />
          </Lazy>
        ),
      },
      {
        path: 'tax-declaration',
        element: (
          <Lazy>
            <TaxDeclarationPage />
          </Lazy>
        ),
      },
      {
        path: 'expenses',
        element: (
          <Lazy>
            <ExpensesPage />
          </Lazy>
        ),
      },
      {
        path: 'approval-inbox',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER']}>
            <Lazy>
              <ApprovalInboxPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'kudos',
        element: (
          <Lazy>
            <KudosPage />
          </Lazy>
        ),
      },
      {
        path: 'esignatures',
        element: (
          <Lazy>
            <ESignaturePage />
          </Lazy>
        ),
      },
      {
        path: 'lms',
        element: (
          <Lazy>
            <LmsPage />
          </Lazy>
        ),
      },
      {
        path: 'assets',
        element: (
          <Lazy>
            <AssetsPage />
          </Lazy>
        ),
      },
      {
        path: 'travel',
        element: (
          <Lazy>
            <TravelPage />
          </Lazy>
        ),
      },
      {
        path: 'loans',
        element: (
          <Lazy>
            <LoansPage />
          </Lazy>
        ),
      },
      {
        path: 'rooms',
        element: (
          <Lazy>
            <RoomsPage />
          </Lazy>
        ),
      },
      {
        path: 'wfh',
        element: (<Lazy><WFHPage /></Lazy>),
      },
      {
        path: 'shift-swap',
        element: (<Lazy><ShiftSwapPage /></Lazy>),
      },
      {
        path: 'referrals',
        element: (<Lazy><ReferralPage /></Lazy>),
      },
      {
        path: 'fnf',
        element: (<Lazy><FnFPage /></Lazy>),
      },
      {
        path: 'salary-revision',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy><SalaryRevisionPage /></Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'compliance',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy><CompliancePage /></Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'posh',
        element: (<Lazy><POSHPage /></Lazy>),
      },
      {
        path: 'timesheets',
        element: (<Lazy><TimesheetPage /></Lazy>),
      },
      {
        path: 'benefits',
        element: (<Lazy><BenefitsPage /></Lazy>),
      },
      {
        path: 'pip',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER']}>
            <Lazy><PIPPage /></Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'nine-box',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy><NineBoxPage /></Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'headcount',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy><HeadcountPage /></Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'career',
        element: (<Lazy><CareerPage /></Lazy>),
      },
      {
        path: 'succession',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy><SuccessionPage /></Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'chat',
        element: (<Lazy><ChatPage /></Lazy>),
      },
      { path: 'ewa', element: (<Lazy><EWAPage /></Lazy>) },
      { path: 'attrition', element: (<Lazy><AttritionPage /></Lazy>) },
      { path: 'biometric-devices', element: (<Lazy><BiometricDevicesPage /></Lazy>) },
      { path: 'hiring-drives', element: (<Lazy><HiringDrivesPage /></Lazy>) },
      { path: 'pay-equity', element: (<Lazy><PayEquityPage /></Lazy>) },
      { path: 'interview-scorecards', element: (<Lazy><InterviewScorecardsPage /></Lazy>) },
      { path: 'resume-parse', element: (<Lazy><ResumeParsePage /></Lazy>) },
      { path: 'contractors', element: (<Lazy><ContractorsPage /></Lazy>) },
      { path: 'esop', element: (<Lazy><ESOPPage /></Lazy>) },
      { path: 'eap', element: (<Lazy><EAPPage /></Lazy>) },
      {
        path: 'directory',
        element: (
          <Lazy>
            <DirectoryPage />
          </Lazy>
        ),
      },
      {
        path: 'org-chart',
        element: (
          <Lazy>
            <OrgChartPage />
          </Lazy>
        ),
      },
      {
        path: 'settings',
        element: (
          <Lazy>
            <SettingsPage />
          </Lazy>
        ),
      },
      {
        path: 'suggestions',
        element: (
          <Lazy>
            <SuggestionBoxPage />
          </Lazy>
        ),
      },
      {
        path: 'hr-policies',
        element: (
          <Lazy>
            <HRPolicyPage />
          </Lazy>
        ),
      },
      {
        path: 'helpdesk',
        element: (
          <Lazy>
            <HelpDeskPage />
          </Lazy>
        ),
      },
      {
        path: 'my-payslips',
        element: (
          <Lazy>
            <MyPayslipsPage />
          </Lazy>
        ),
      },
      {
        path: 'my-letters',
        element: (<Lazy><MyLettersPage /></Lazy>),
      },
      {
        path: 'pulse-surveys',
        element: (
          <Lazy>
            <PulseSurveyPage />
          </Lazy>
        ),
      },
      {
        path: 'onboarding',
        element: (
          <Lazy>
            <OnboardingPage />
          </Lazy>
        ),
      },
      {
        path: 'performance',
        element: (
          <Lazy>
            <PerformancePage />
          </Lazy>
        ),
      },
      {
        path: 'recruitment',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <RecruitmentPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'offboarding',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <OffboardingPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'analytics',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <AnalyticsPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <ReportsPage />
            </Lazy>
          </RoleGuard>
        ),
      },
      {
        path: 'announcements',
        element: (
          <Lazy>
            <AnnouncementsPage />
          </Lazy>
        ),
      },
      {
        path: 'office-locations',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <OfficeLocationsPage />
            </Lazy>
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: '/super-admin/login',
    element: (
      <Lazy>
        <SuperAdminLoginPage />
      </Lazy>
    ),
  },
  {
    path: '/super-admin/dashboard',
    element: (
      <SuperAdminGuard>
        <Lazy>
          <SuperAdminDashboard />
        </Lazy>
      </SuperAdminGuard>
    ),
  },
  {
    path: '*',
    element: (
      <Lazy>
        <NotFoundPage />
      </Lazy>
    ),
  },
]);
