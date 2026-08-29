"use client";

import { JamPhase } from "@/types/JamType";
import { ListingPageVersion } from "@/types/GameType";

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

  if (isPostJamPhase(currentPhase)) {
    return "POST_JAM";
  }

  return "ALL";
}

export const listingPageVersionOptions: Array<{
  value: ListingPageVersion;
  label: string;
  description: string;
  icon: "gamepad2" | "clock" | "hammer";
}> = [
  {
    value: "ALL",
    label: "All Versions",
    icon: "gamepad2",
    description:
      "Show the post-jam version of the game if available, otherwise show the jam version",
  },
  {
    value: "JAM",
    label: "Jam Versions",
    icon: "clock",
    description: "Only show jam versions of games",
  },
  {
    value: "POST_JAM",
    label: "Post-Jam Versions",
    icon: "hammer",
    description: "Only show post-jam versions of games",
  },
];
