"use client";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label="Змінити тему"
      className={`relative inline-flex items-center gap-2 rounded-xl border border-border bg-surface hover:bg-card px-3 py-2 text-sm overflow-hidden active:scale-95 ${compact ? "" : "w-full"}`}
    >
      <span className="relative w-5 h-5 inline-block">
        <Sun className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100 text-accent"}`} />
        <Moon className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${isDark ? "opacity-100 rotate-0 scale-100 text-accent" : "opacity-0 rotate-90 scale-50"}`} />
      </span>
      {!compact && <span className="text-muted">{isDark ? "Темна" : "Світла"}</span>}
    </button>
  );
}
