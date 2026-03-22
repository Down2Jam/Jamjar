/**
 * @file Provides the site custom theme system to populate the site styles
 *
 * @author Ategon
 * @created 2025-7-23
 */
"use client";

import { SiteThemeType } from "@/types/SiteThemeType";
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useSiteThemes } from "@/hooks/queries";

type ColorsMap = SiteThemeType["colors"];

interface SiteThemeContextType {
  siteTheme: SiteThemeType;
  colors: ColorsMap;
  allSiteThemes: SiteThemeType[];
  setSiteTheme: (name: string) => void;
  setPreviewedSiteTheme: (name: string | null) => void;
}

const SiteThemeContext = createContext<SiteThemeContextType | undefined>(
  undefined
);

export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const [siteTheme, setSiteThemeBacking] = useState<SiteThemeType>({
    name: "Dummy",
    authors: [],
    type: "Dark",
    colors: {},
  });
  const [previewedSiteTheme, setPreviewedSiteThemeBacking] =
    useState<SiteThemeType | null>(null);
  const [isThemeReady, setIsThemeReady] = useState(false);

  const { data: allSiteThemes = [] } = useSiteThemes();

  useEffect(() => {
    if (allSiteThemes.length == 0) return;

    const currentTheme = Cookies.get("theme");
    const match = allSiteThemes.find((t: SiteThemeType) => t.name === currentTheme);

    if (match) {
      setSiteThemeBacking(match);
    } else {
      const defaultMatch = allSiteThemes.find((t: SiteThemeType) => t.name === "Obsidian");
      setSiteThemeBacking(defaultMatch as SiteThemeType);
    }
  }, [allSiteThemes]);

  function setSiteTheme(name: string) {
    const match = allSiteThemes.find((t: SiteThemeType) => t.name === name);
    if (match) {
      Cookies.set("theme", match.name, { expires: 36500 });
      setSiteThemeBacking(match);
    }
  }

  function setPreviewedSiteTheme(name: string | null) {
    if (name == null) {
      setPreviewedSiteThemeBacking(null);
      return;
    }

    const match = allSiteThemes.find((t: SiteThemeType) => t.name === name);
    if (match) {
      setPreviewedSiteThemeBacking(match);
    }
  }

  const effectiveTheme = previewedSiteTheme ?? siteTheme;

  useEffect(() => {
    if (isThemeReady) return;
    if (Object.keys(effectiveTheme.colors).length === 0) return;
    setIsThemeReady(true);
  }, [effectiveTheme.colors, isThemeReady]);

  useEffect(() => {
    if (!isThemeReady) return;
    document.documentElement.setAttribute("data-theme-ready", "true");
  }, [isThemeReady]);

  return (
    <SiteThemeContext.Provider
      value={{
        siteTheme: effectiveTheme,
        colors: effectiveTheme.colors,
        allSiteThemes: allSiteThemes.filter((theme: SiteThemeType) => !theme.hidden),
        setSiteTheme,
        setPreviewedSiteTheme,
      }}
    >
      {children}
    </SiteThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(SiteThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
