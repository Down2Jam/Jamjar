"use client";

import React, { createContext, useContext, useMemo } from "react";

export type ThemeColors = Record<string, string>;

export interface Theme {
  name: string;
  type?: "Light" | "Dark" | string;
  colors: ThemeColors;
}

export const defaultTheme: Theme = {
  name: "Default",
  type: "Dark",
  colors: {
    text: "#e6e6e6",
    textFaded: "#a1a1aa",
    base: "#1f2937",
    mantle: "#111827",
    crust: "#0b1220",
    surface: "#0f172a",
    blue: "#60a5fa",
    blueDark: "#3b82f6",
    blueLight: "#93c5fd",
    blueDarkDark: "#1d4ed8",
    green: "#34d399",
    greenDark: "#10b981",
    greenLight: "#6ee7b7",
    greenDarkDark: "#059669",
    pink: "#f472b6",
    pinkDark: "#ec4899",
    pinkLight: "#f9a8d4",
    pinkDarkDark: "#be185d",
    red: "#f87171",
    redDark: "#ef4444",
    redLight: "#fca5a5",
    redDarkDark: "#b91c1c",
    yellow: "#facc15",
    yellowDark: "#eab308",
    yellowLight: "#fde047",
    yellowDarkDark: "#a16207",
    purple: "#c084fc",
    purpleDark: "#a855f7",
    purpleLight: "#d8b4fe",
    purpleDarkDark: "#7e22ce",
    gray: "#9ca3af",
    grayDark: "#6b7280",
    grayLight: "#d1d5db",
    grayDarkDark: "#4b5563",
    orange: "#fb923c",
    indigo: "#818cf8",
  },
};

type ThemeProviderProps = {
  theme?: Partial<Theme>;
  children: React.ReactNode;
};

const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const mergedTheme = useMemo<Theme>(() => {
    if (!theme) return defaultTheme;

    return {
      ...defaultTheme,
      ...theme,
      colors: {
        ...defaultTheme.colors,
        ...(theme.colors ?? {}),
      },
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
