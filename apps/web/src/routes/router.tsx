import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { AuthGuard } from '@/components/guards/AuthGuard';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/components/ui/page-loader';

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

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
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
      <Lazy>
        <SuperAdminDashboard />
      </Lazy>
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
