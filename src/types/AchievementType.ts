import { GameType } from "./GameType";
import { UserType } from "./UserType";

export interface AchievementType {
  id: number;
  name: string;
  description: string;
  users: UserType[];
  game: GameType;
}
