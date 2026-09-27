import type { ScoreType } from "@/types/ScoreType";

// Wilson lower bound for the share of opponents beaten (95% confidence).
// Using opponents rather than submissions prevents repeat attempts inflating a field.
function rankingStrength(wins: number, opponents: number) {
  if (opponents <= 0) return 0;
  const z = 1.96;
  const p = wins / opponents;
  return (p + z * z / (2 * opponents) - z * Math.sqrt(
    p * (1 - p) / opponents + z * z / (4 * opponents * opponents),
  )) / (1 + z * z / opponents);
}

function withPlacement(score: ScoreType) {
  const lowerIsBetter = score.leaderboard.type === "GOLF" || score.leaderboard.type === "SPEEDRUN";
  if (!Array.isArray(score.leaderboard.scores)) {
    return { ...score, placement: null, playerCount: 0, topPercent: null, strength: -1 };
  }
  const players = new Map<number, number>();
  for (const entry of [...score.leaderboard.scores, score]) {
    const userId = entry.userId ?? entry.user?.id;
    if (userId == null || !Number.isFinite(entry.data)) continue;
    const previous = players.get(userId);
    if (previous == null || (lowerIsBetter ? entry.data < previous : entry.data > previous)) {
      players.set(userId, entry.data);
    }
  }
  const targetId = score.userId ?? score.user?.id;
  if (targetId == null || !players.has(targetId)) {
    return { ...score, placement: null, playerCount: 0, topPercent: null, strength: -1 };
  }
  const opponents = [...players.entries()].filter(([id]) => id !== targetId).map(([, value]) => value);
  const ahead = opponents.filter((value) => lowerIsBetter ? value < score.data : value > score.data).length;
  const tied = opponents.filter((value) => value === score.data).length;
  const placement = ahead + 1;
  return {
    ...score,
    placement,
    playerCount: players.size,
    topPercent: placement / players.size * 100,
    strength: rankingStrength(opponents.length - ahead - tied / 2, opponents.length),
  };
}

export function getEarnedRecapScores(scores: ScoreType[], jamId: number | null) {
  const best = new Map<number, ScoreType>();
  for (const score of scores) {
    const board = score.leaderboard;
    if (!board?.game || board.game.jamId !== jamId) continue;
    const previous = best.get(board.id);
    const lowerIsBetter = board.type === "GOLF" || board.type === "SPEEDRUN";
    if (!previous || (lowerIsBetter ? score.data < previous.data : score.data > previous.data)) {
      best.set(board.id, score);
    }
  }
  return [...best.values()].map(withPlacement).sort((a, b) =>
    b.strength - a.strength ||
    b.playerCount - a.playerCount ||
    a.leaderboard.game.name.localeCompare(b.leaderboard.game.name) ||
    a.leaderboard.name.localeCompare(b.leaderboard.name),
  );
}
