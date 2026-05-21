import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UiState {
  theme: Theme;
  sidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(isDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,

      setTheme: (theme) => {
        set({ theme });
        applyThemeClass(theme);
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },
    }),
    {
      name: 'hrms-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeClass(state.theme);
      },
    },
  ),
);

// Keep system theme in sync when user changes OS preference
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useUiStore.getState();
    if (theme === 'system') applyThemeClass('system');
  });
}
