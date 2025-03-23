import { LeaderboardType } from "./LeaderboardType";
import { UserType } from "./UserType";

export interface ScoreType {
  id: number;
  data: number;
  evidence: string;
  user: UserType;
  leaderboard: LeaderboardType;
}
