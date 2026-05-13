import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
}

interface SuperAdminAuthState {
  admin: SuperAdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (admin: SuperAdminUser, accessToken: string) => void;
  logout: () => void;
}

export const useSuperAdminAuthStore = create<SuperAdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      isAuthenticated: false,

      login: (admin, accessToken) => {
        set({ admin, accessToken, isAuthenticated: true });
      },

      logout: () => {
        set({ admin: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'hrms-super-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        admin: state.admin,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
