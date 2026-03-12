import { TrackType } from "./TrackType";

export interface TrackResultType
  extends Pick<TrackType, "id" | "slug" | "name" | "url" | "composer" | "game"> {
  categoryAverages: Array<{
    averageScore: number;
    averageUnrankedScore: number;
    categoryId: number;
    categoryName: string;
    ratingCount: number;
    rankedRatingCount: number;
    placement: number;
  }>;
}
