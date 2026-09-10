import type { RecentScoreType } from "@/types/RecentScoreType";

export function formatRecentScore(score: RecentScoreType) {
  if (score.leaderboard.type === "SCORE" || score.leaderboard.type === "GOLF") {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: score.leaderboard.decimalPlaces,
      maximumFractionDigits: score.leaderboard.decimalPlaces,
    }).format(score.data / 10 ** score.leaderboard.decimalPlaces);
  }

  const hours = Math.floor(score.data / 3_600_000);
  const minutes = Math.floor((score.data % 3_600_000) / 60_000);
  const seconds = Math.floor((score.data % 60_000) / 1000);
  const milliseconds = score.data % 1000;
  return `${hours > 0 ? `${hours}:` : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}${
    milliseconds > 0 ? `.${milliseconds.toString().padStart(3, "0")}` : ""
  }`;
}
