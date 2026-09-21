import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (isDark: boolean) => void;
  initTheme: () => void;
}

const getInitialTheme = (): boolean => {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("jtalk_theme");
  if (saved) {
    return saved === "dark";
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  initTheme: () => {
    const isDark = getInitialTheme();
    set({ isDark });
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
  toggleTheme: () => {
    const nextDark = !get().isDark;
    set({ isDark: nextDark });
    if (typeof window !== "undefined") {
      localStorage.setItem("jtalk_theme", nextDark ? "dark" : "light");
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  },
  setDark: (isDark: boolean) => {
    set({ isDark });
    if (typeof window !== "undefined") {
      localStorage.setItem("jtalk_theme", isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  },
}));

export default useThemeStore;
