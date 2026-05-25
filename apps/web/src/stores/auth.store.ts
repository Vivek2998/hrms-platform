import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRole, OrgPlan } from '@hrms/shared-types';

export interface AuthUser {
  id: string;
  organizationId: string;
  orgName: string;
  orgPlan: OrgPlan;
  role: UserRole;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeCode: string;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

// FE-02 FIX: Move token storage from localStorage to sessionStorage.
//
// What was wrong:
//   localStorage persists tokens FOREVER across browser restarts.  Any
//   malicious script injected via XSS (or a compromised browser extension)
//   can read localStorage at any time, including days later.
//
// What we do instead:
//   • accessToken  → sessionStorage  (tab-scoped; cleared when tab/browser closes)
//   • refreshToken → in-memory ONLY  (never written to any storage)
//   • user / isAuthenticated → sessionStorage  (restores UI state on page refresh)
//
// Trade-off:
//   After a page refresh the refresh token is gone from memory.  The next 401
//   (when the 15-minute access token expires) triggers logout and a re-login
//   prompt.  This is the correct secure default for an HRMS — employee sessions
//   should not silently extend themselves across browser restarts.
//
//   The ideal long-term fix is to have the API set the refresh token in an
//   httpOnly, Secure, SameSite=Strict cookie so it never touches JavaScript
//   memory at all.  That requires a backend change and is tracked separately.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'hrms-auth',
      // Changed from localStorage → sessionStorage
      storage: createJSONStorage(() => sessionStorage),
      // refreshToken is intentionally excluded — it lives in memory only.
      // Persisting it (even to sessionStorage) keeps a long-lived secret in
      // DOM-accessible storage which any XSS payload can exfiltrate.
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // refreshToken: deliberately NOT included
      }),
    },
  ),
);
