import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme-storage');
    if (stored === 'light' || stored === 'dark') {
      return stored as Theme;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-storage', newTheme);
      updateDocumentTheme(newTheme);
      return { theme: newTheme };
    }),
  setTheme: (theme: Theme) => {
    localStorage.setItem('theme-storage', theme);
    updateDocumentTheme(theme);
    set({ theme });
  },
}));

export const updateDocumentTheme = (theme: Theme) => {
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};
