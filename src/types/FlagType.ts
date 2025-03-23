import { GameType } from "./GameType";

export interface FlagType {
  id: number;
  name: string;
  description?: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  games: GameType[];
}
