import type { LeaderboardTypeType } from "./LeaderboardType";

export interface RecentScoreType {
  id: number;
  data: number;
  evidence: string;
  scoredAt: string;
  placement: number;
  totalScores: number;
  percentile: number;
  user: {
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  };
  leaderboard: {
    id: number;
    name: string;
    type: LeaderboardTypeType;
    decimalPlaces: number;
  };
  game: {
    id: number;
    slug: string;
    name: string;
    thumbnail?: string | null;
    pageVersion: "JAM" | "POST_JAM";
  };
}
