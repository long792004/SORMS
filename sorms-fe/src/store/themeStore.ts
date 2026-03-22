import { create } from "zustand";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const saved = localStorage.getItem("theme_mode") as ThemeMode | null;
const initialMode: ThemeMode = saved ?? "dark";

export const useThemeStore = create<ThemeState>((set) => ({
  mode: initialMode,
  toggleMode: () =>
    set((state) => {
      const nextMode: ThemeMode = state.mode === "dark" ? "light" : "dark";
      localStorage.setItem("theme_mode", nextMode);
      return { mode: nextMode };
    }),
  setMode: (mode) => {
    localStorage.setItem("theme_mode", mode);
    set({ mode });
  }
}));
