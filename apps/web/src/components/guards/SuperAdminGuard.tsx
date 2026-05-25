import { Navigate } from 'react-router-dom';
import { useSuperAdminAuthStore } from '@/stores/super-admin-auth.store';

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

/**
 * Protects all Super Admin routes.
 * Redirects unauthenticated visitors to /super-admin/login.
 * Also validates that the stored access token has not expired.
 */
export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { isAuthenticated, accessToken } = useSuperAdminAuthStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    accessToken: s.accessToken,
  }));

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/super-admin/login" replace />;
  }

  // Check JWT expiry without a library — decode payload, check `exp`
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]!)) as { exp: number };
    if (payload.exp * 1000 < Date.now()) {
      // Token expired — force re-login
      useSuperAdminAuthStore.getState().logout();
      return <Navigate to="/super-admin/login" replace />;
    }
  } catch {
    useSuperAdminAuthStore.getState().logout();
    return <Navigate to="/super-admin/login" replace />;
  }

  return <>{children}</>;
}
