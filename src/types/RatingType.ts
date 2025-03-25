import { GameType } from "./GameType";
import { RatingCategoryType } from "./RatingCategoryType";
import { UserType } from "./UserType";

export interface RatingType {
  id: number;
  value: number;
  category: RatingCategoryType;
  user: UserType;
  game: GameType;
  userId: number;
  gameId: number;
}
