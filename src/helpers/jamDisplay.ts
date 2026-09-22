import type { ActiveJamResponse } from "./jam";
import type { JamType, JamPhase } from "@/types/JamType";

export function isPostJamPhase(phase?: JamPhase | null) {
  return phase === "Post-Jam Refinement" || phase === "Post-Jam Rating";
}

export function isPreJamPhase(phase?: JamPhase | null) {
  return (
    phase === "Suggestion" ||
    phase === "Elimination" ||
    phase === "Voting" ||
    phase === "Upcoming Jam"
  );
}

const THEME_VOTING_CUTOFF_MS = 24 * 60 * 60 * 1000;

export function isThemeVotingOpen(
  phase?: JamPhase | null,
  jam?: Pick<JamType, "startTime"> | null,
  now = new Date(),
) {
  if (phase !== "Voting" || !jam) return false;

  return (
    new Date(jam.startTime).getTime() - now.getTime() >
    THEME_VOTING_CUTOFF_MS
  );
}

export function getDisplayJamForPublicView(
  response?: ActiveJamResponse | null,
): JamType | null {
  if (!response) return null;

  if (isPostJamPhase(response.phase) && response.nextJam) {
    return response.nextJam;
  }

  return response.jam ?? null;
}

export function getNextJamForHome(response?: ActiveJamResponse | null): JamType | null {
  if (!response) return null;

  if (isPreJamPhase(response.phase)) {
    return response.jam ?? response.nextJam ?? null;
  }

  return response.nextJam ?? null;
}
