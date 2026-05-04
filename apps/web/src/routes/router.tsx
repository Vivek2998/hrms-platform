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
const LeaveTypesPage = lazy(() => import('@/pages/leaves/LeaveTypesPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));

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
        path: 'leave-types',
        element: (
          <RoleGuard allow={['SUPER_ADMIN', 'ORG_ADMIN', 'HR']}>
            <Lazy>
              <LeaveTypesPage />
            </Lazy>
          </RoleGuard>
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
    ],
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
