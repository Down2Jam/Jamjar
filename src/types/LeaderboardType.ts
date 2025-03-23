import { GameType } from "./GameType";
import { ScoreType } from "./ScoreType";

export type LeaderboardTypeType = "SCORE" | "GOLF" | "TIME" | "ENDURANCE";

export interface LeaderboardType {
  id: number;
  name: string;
  type: LeaderboardTypeType;
  game: GameType;
  scores: ScoreType[];
  onlyBest: boolean;
}
