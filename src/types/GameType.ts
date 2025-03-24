import { AchievementType } from "./AchievementType";
import { CommentType } from "./CommentType";
import { DownloadLinkType } from "./DownloadLinkType";
import { FlagType } from "./FlagType";
import { GameTagType } from "./GameTagType";
import { JamType } from "./JamType";
import { LeaderboardType } from "./LeaderboardType";
import { RatingCategoryType } from "./RatingCategoryType";
import { RatingType } from "./RatingType";
import { TeamType } from "./TeamType";

export interface GameType {
  id: number;
  slug: string;
  name: string;
  description?: string;
  thumbnail?: string;
  banner?: string;
  createdAt: Date;
  updatedAt: Date;
  downloadLinks: DownloadLinkType[];
  jam: JamType;
  category: "ODA" | "REGULAR" | "EXTRA";
  teamId: number;
  team: TeamType;
  ratingCategories: RatingCategoryType[];
  published: boolean;
  themeJustification: string;
  achievements: AchievementType[];
  leaderboards: LeaderboardType[];
  flags: FlagType[];
  tags: GameTagType[];
  comments: CommentType[];
  majRatingCategories: RatingCategoryType[];
  ratings: RatingType[];
  jamId: number;
}
