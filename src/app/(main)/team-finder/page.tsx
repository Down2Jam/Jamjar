"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import TeamFinder from "@/components/team-finder";
import { useTheme } from "@/providers/useSiteTheme";
import { Suspense } from "react";

export default function GamesPage() {
  const uiText = useUiTranslations();
  const { siteTheme, colors } = useTheme();
  const headerColor = colors["text"];

  return (
    <>
      <header className="py-2 text-center">
        <p
          className="text-3xl font-semibold"
          style={{
            color: headerColor,
            textShadow:
              siteTheme.type === "Light"
                ? "none"
                : "0 1px 5px rgba(0, 0, 0, 0.75)",
          }}
        >
           {uiText("Navbar.TeamFinder.Title")} </p>
        <p
          className="mt-1 text-sm"
          style={{
            color: headerColor,
            opacity: 0.82,
            textShadow:
              siteTheme.type === "Light"
                ? "none"
                : "0 1px 4px rgba(0, 0, 0, 0.8)",
          }}
        >
           {uiText("AppStrings.ThisIsASpotToFindTeammatesTo")} </p>
      </header>

      <Suspense fallback={<div>{uiText("ThemeSuggestions.Loading.Title")}</div>}>
        <TeamFinder />
      </Suspense>
    </>
  );
}
