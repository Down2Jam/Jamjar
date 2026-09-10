/**
 * @file Provides the site custom theme system to populate the site styles
 *
 * @author Ategon
 * @created 2025-7-23
 */
"use client";

import { SiteThemeType } from "@/types/SiteThemeType";
import { UserType } from "@/types/UserType";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { queryKeys, useSelf, useSiteThemes } from "@/hooks/queries";
import { SiteThemeContext } from "./SiteThemeContext";
import { hasCookie } from "@/helpers/cookie";
import { updateCurrentSiteTheme } from "@/requests/siteTheme";
import { useQueryClient } from "@tanstack/react-query";

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

  const hasToken = hasCookie("token");
  const { data: allSiteThemes = [] } = useSiteThemes();
  const { data: user, isFetched: isUserFetched } = useSelf(hasToken);
  const queryClient = useQueryClient();

  const persistAccountTheme = useCallback(
    async (themeName: string) => {
      const response = await updateCurrentSiteTheme(themeName);
      if (!response?.ok) return;

      queryClient.setQueryData<UserType>(
        queryKeys.user.self(),
        (currentUser) =>
          currentUser ? { ...currentUser, siteTheme: themeName } : currentUser,
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.siteTheme.list(),
      });
    },
    [queryClient],
  );

  useEffect(() => {
    if (allSiteThemes.length == 0) return;
    if (hasToken && !isUserFetched) return;

    const currentTheme = user?.siteTheme ?? Cookies.get("theme");
    const match = allSiteThemes.find((t: SiteThemeType) => t.name === currentTheme);
    const defaultMatch = allSiteThemes.find(
      (t: SiteThemeType) => t.name === "Obsidian",
    );
    const resolvedTheme = match ?? defaultMatch;

    if (!resolvedTheme) return;

    Cookies.set("theme", resolvedTheme.name, { expires: 36500 });
    setSiteThemeBacking(resolvedTheme);

    if (user && !user.siteTheme) {
      void persistAccountTheme(resolvedTheme.name);
    }
  }, [
    allSiteThemes,
    hasToken,
    isUserFetched,
    persistAccountTheme,
    user,
  ]);

  const setSiteTheme = useCallback(
    (name: string) => {
      const match = allSiteThemes.find((t: SiteThemeType) => t.name === name);
      if (match) {
        Cookies.set("theme", match.name, { expires: 36500 });
        setSiteThemeBacking(match);
        if (user) void persistAccountTheme(match.name);
      }
    },
    [allSiteThemes, persistAccountTheme, user],
  );

  const setPreviewedSiteTheme = useCallback(
    (name: string | null) => {
      if (name == null) {
        setPreviewedSiteThemeBacking(null);
        return;
      }

      const match = allSiteThemes.find((t: SiteThemeType) => t.name === name);
      if (match) {
        setPreviewedSiteThemeBacking(match);
      }
    },
    [allSiteThemes],
  );

  const effectiveTheme = previewedSiteTheme ?? siteTheme;
  const visibleSiteThemes = useMemo(
    () => {
      const pinnedThemes = ["obsidian", "latte"];

      return allSiteThemes
        .filter((theme: SiteThemeType) => !theme.hidden)
        .sort((a, b) => {
          const aPriority = pinnedThemes.indexOf(a.name.toLowerCase());
          const bPriority = pinnedThemes.indexOf(b.name.toLowerCase());

          if (aPriority === -1 && bPriority === -1) {
            const usageDifference =
              (b.usageCount ?? 0) - (a.usageCount ?? 0);

            return usageDifference || a.name.localeCompare(b.name);
          }
          if (aPriority === -1) return 1;
          if (bPriority === -1) return -1;
          return aPriority - bPriority;
        });
    },
    [allSiteThemes],
  );
  const value = useMemo(
    () => ({
      siteTheme: effectiveTheme,
      colors: effectiveTheme.colors,
      allSiteThemes: visibleSiteThemes,
      setSiteTheme,
      setPreviewedSiteTheme,
    }),
    [
      effectiveTheme,
      visibleSiteThemes,
      setSiteTheme,
      setPreviewedSiteTheme,
    ],
  );

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
      value={value}
    >
      {children}
    </SiteThemeContext.Provider>
  );
}
