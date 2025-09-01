"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useTheme as useNextTheme } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const { theme: nextTheme, setTheme } = useNextTheme();
  
  // Use a state to track the theme with a default value
  const [theme, setCurrentTheme] = useState(nextTheme || "light");
  
  // Update the theme state when nextTheme changes
  useEffect(() => {
    if (nextTheme) {
      setCurrentTheme(nextTheme);
    }
  }, [nextTheme]);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    setCurrentTheme(newTheme); // Update local state immediately for UI
  };

  // Create a default value for the context when not mounted
  const defaultValue = {
    theme: theme,
    setTheme: (t: string) => {
      setTheme(t);
      setCurrentTheme(t);
    },
    toggleTheme,
  };

  // Always provide a value, even when not mounted
  return (
    <ThemeContext.Provider value={defaultValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};