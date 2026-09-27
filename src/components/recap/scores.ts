import type { GameType } from "@/types/GameType";

export function getJamRecapScores(
  game: Pick<GameType, "jamScores" | "scores"> | null | undefined,
) {
  // An explicit empty jamScores object is authoritative. Never replace it
  // with legacy or post-jam ratings from a different version of the game.
  return game?.jamScores ?? game?.scores ?? {};
}
