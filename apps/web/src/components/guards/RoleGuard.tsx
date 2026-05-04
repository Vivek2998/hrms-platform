import { Navigate } from 'react-router-dom';
import type { UserRole } from '@hrms/shared-types';
import { useAuthStore } from '@/stores/auth.store';

interface RoleGuardProps {
  children: React.ReactNode;
  allow: UserRole[];
}

export function RoleGuard({ children, allow }: RoleGuardProps) {
  const role = useAuthStore((s) => s.user?.role);

  if (!role || !allow.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
