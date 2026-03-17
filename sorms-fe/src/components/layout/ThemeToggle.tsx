import { MoonStar, SunMedium } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);

  return (
    <button
      onClick={toggleMode}
      className="rounded-xl border border-slate-200 bg-white/70 p-2 text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
      aria-label="Toggle theme"
      title={mode === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {mode === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </button>
  );
}
