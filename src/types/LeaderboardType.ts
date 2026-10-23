import { GameType } from "./GameType";
import { ScoreType } from "./ScoreType";

export type LeaderboardTypeType = "SCORE" | "GOLF" | "SPEEDRUN" | "ENDURANCE";

export interface LeaderboardType {
  id: number;
  name: string;
  type: LeaderboardTypeType;
  game: GameType;
  scores: ScoreType[];
  onlyBest: boolean;
  maxUsersShown: number;
  decimalPlaces: number;
}

export type LeaderboardInput = Pick<
  LeaderboardType,
  "name" | "type" | "onlyBest" | "maxUsersShown" | "decimalPlaces"
> & { id?: number };
