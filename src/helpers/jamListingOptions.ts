import type { JamPhase, JamType } from "@/types/JamType";

const CONTENT_LISTING_PHASES = new Set<JamPhase>([
  "Submission",
  "Rating",
  "Post-Jam Refinement",
  "Post-Jam Rating",
]);

type ListingJam = Pick<JamType, "id" | "startTime"> & {
  games?: unknown[];
};

export function hasSubmittedGames(jam: Partial<ListingJam> | null | undefined) {
  return Array.isArray(jam?.games) && jam.games.length > 0;
}

export function shouldShowJamInContentListings(
  jam: Partial<ListingJam> | null | undefined,
  currentPhase?: JamPhase | string | null,
  currentJamId?: string | number | null,
) {
  if (!jam?.id) return false;

  if (hasSubmittedGames(jam)) {
    return true;
  }

  const isCurrentJam =
    currentJamId != null && String(jam.id) === String(currentJamId);

  if (isCurrentJam && CONTENT_LISTING_PHASES.has(currentPhase as JamPhase)) {
    return true;
  }

  if (!jam.startTime) {
    return !isCurrentJam;
  }

  const start = new Date(jam.startTime).getTime();
  return Number.isFinite(start) && start <= Date.now();
}
