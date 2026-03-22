import { create } from 'zustand';

type Theme = 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  return 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    localStorage.setItem('theme-storage', 'light');
    updateDocumentTheme('light');
    set({ theme: 'light' });
  },
  setTheme: (_theme: Theme) => {
    localStorage.setItem('theme-storage', 'light');
    updateDocumentTheme('light');
    set({ theme: 'light' });
  },
}));

export const updateDocumentTheme = (_theme: Theme) => {
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('theme-storage', 'light');
  }
};
