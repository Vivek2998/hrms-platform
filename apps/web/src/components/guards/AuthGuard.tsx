import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protects all authenticated routes.
 * FE-01 FIX: Previously only checked the `isAuthenticated` flag — a boolean
 * that never resets automatically — so an expired token kept the user "logged
 * in" on screen while every API call was failing with 401.  Now we also decode
 * the JWT payload and verify `exp` client-side so stale sessions are evicted
 * immediately on navigation.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  // One selector per primitive — avoids inline object selector anti-pattern
  // where Object.is({}, {}) is always false → Zustand infinite re-render loop.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken     = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Decode the JWT payload (base64url middle segment) and check exp.
  // This runs synchronously on every guarded render — it's O(1) string work,
  // not a network call, so there is no performance concern.
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]!)) as { exp: number };
    if (payload.exp * 1000 < Date.now()) {
      // Token is expired — clear auth state and send user to login
      useAuthStore.getState().logout();
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } catch {
    // Malformed token — treat as unauthenticated
    useAuthStore.getState().logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
