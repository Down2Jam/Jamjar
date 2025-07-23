// context/theme-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import obsidian from "@/themes/obsidian.json";
import mocha from "@/themes/mocha.json";

export interface Theme {
  name: string;
  authors: string[];
  description: string;
  version: string;
  keywords: string[];
  repository: string;
  type: "Light" | "Dark" | string;
  colors: Record<string, string>;
}

interface ThemeContextType {
  currentTheme: Theme;
  allThemes: ThemeOption[];
  setThemeByKey: (filename: string) => void;
}

export interface ThemeOption {
  name: string;
  filename: string;
}

// Utility to darken or lighten a hex color
function adjustColor(hex: string, amount: number): string {
  let color = hex.startsWith("#") ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const r = Math.min(
    255,
    Math.max(0, parseInt(color.slice(0, 2), 16) + amount)
  );
  const g = Math.min(
    255,
    Math.max(0, parseInt(color.slice(2, 4), 16) + amount)
  );
  const b = Math.min(
    255,
    Math.max(0, parseInt(color.slice(4, 6), 16) + amount)
  );

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function resolveColor(value: string, colors: Record<string, string>): string {
  if (!value.startsWith("@")) return value;

  const steps = value
    .slice(1)
    .split(">")
    .map((s) => s.trim());
  let baseKey = steps.shift();
  let current = colors[baseKey!];

  if (!current || current.startsWith("@")) return value;

  for (const step of steps) {
    if (step === "darken") current = adjustColor(current, -30);
    else if (step === "lighten") current = adjustColor(current, +30);
  }

  return current;
}

function resolveTheme(theme: Theme): Theme {
  const resolvedColors: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme.colors)) {
    resolvedColors[key] = resolveColor(value, theme.colors);
  }

  return {
    ...theme,
    colors: resolvedColors,
  };
}

function parseTheme(
  cookieValue: string | undefined,
  allThemes: Theme[],
  fallbackTheme: Theme
): Theme {
  if (!cookieValue) return resolveTheme(fallbackTheme, fallbackTheme.key);

  const match = allThemes.find((t) => t.name === cookieValue);
  if (match) {
    return resolveTheme(match);
  }

  return resolveTheme(fallbackTheme);
}

// CONTEXT SETUP
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() =>
    resolveTheme(mocha, "mocha.json")
  );
  const [allThemes, setAllThemes] = useState<Theme[]>([]);

  useEffect(() => {
    const themes = [resolveTheme(mocha), resolveTheme(obsidian)];
    setAllThemes(themes);

    const cookieValue = Cookies.get("theme");
    setCurrentTheme(parseTheme(cookieValue, themes, mocha));
  }, []);

  const setThemeByKey = (filename: string) => {
    const match = allThemes.find((t) => t.name === filename);
    if (match) {
      Cookies.set("theme", match.name, { expires: 36500 });
      setCurrentTheme(resolveTheme(match));
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, allThemes, setThemeByKey }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
