import { GameType } from "./GameType";
import { RatingType } from "./RatingType";

export interface RatingCategoryType {
  id: number;
  name: string;
  description: string;
  ratings: RatingType;
  games: GameType;
  askMajorityContent: boolean;
  order: number;
}
