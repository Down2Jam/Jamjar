"use client";

import type { JamPhase } from "@/types/JamType";
import type { ListingPageVersion } from "@/types/GameType";

export function isJamPhase(phase?: JamPhase | string | null) {
  return phase === "Jamming" || phase === "Submission" || phase === "Rating";
}

export function isPostJamPhase(phase?: JamPhase | string | null) {
  return phase === "Post-Jam Refinement" || phase === "Post-Jam Rating";
}

export function getDefaultListingPageVersion(
  selectedJamId: string,
  currentJamId?: string | null,
  currentPhase?: JamPhase | string | null,
): ListingPageVersion {
  const isCurrentJam = Boolean(currentJamId) && selectedJamId === currentJamId;

  if (!isCurrentJam) {
    return "ALL";
  }

  if (isJamPhase(currentPhase)) {
    return "JAM";
  }

  return "ALL";
}

export function postJamFirst<T extends { pageVersion?: string }>(items: T[], enabled: boolean): T[] {
  return enabled ? [...items].sort((a, b) => Number(b.pageVersion === "POST_JAM") - Number(a.pageVersion === "POST_JAM")) : items;
}

export const listingPageVersionOptions: Array<{
  value: ListingPageVersion;
  label: string;
  description: string;
  icon: "gamepad2" | "clock" | "hammer";
}> = [
  {
    value: "ALL",
    label: "AppStrings.AllVersions",
    icon: "gamepad2",
    description:
      "AppStrings.ShowThePostJamVersionOfTheGame",
  },
  {
    value: "JAM",
    label: "AppStrings.JamVersions",
    icon: "clock",
    description: "AppStrings.OnlyShowJamVersionsOfGames",
  },
  {
    value: "POST_JAM",
    label: "AppStrings.PostJamVersions",
    icon: "hammer",
    description: "AppStrings.OnlyShowPostJamVersionsOfGames",
  },
];
