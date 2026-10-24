"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import TeamFinder from "@/components/team-finder";
import TeamPageCard from "@/components/TeamPageCard";
import { Suspense } from "react";

export default function GamesPage() {
  const uiText = useUiTranslations();

  return (
    <TeamPageCard title={uiText("Navbar.TeamFinder.Title")} description={uiText("AppStrings.ThisIsASpotToFindTeammatesTo")}>

      <Suspense fallback={<div>{uiText("ThemeSuggestions.Loading.Title")}</div>}>
        <TeamFinder />
      </Suspense>
    </TeamPageCard>
  );
}
