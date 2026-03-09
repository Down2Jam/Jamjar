import { AchievementType } from "./AchievementType";
import { CommentType } from "./CommentType";
import { DownloadLinkType } from "./DownloadLinkType";
import { FlagType } from "./FlagType";
import { GameTagType } from "./GameTagType";
import { JamType } from "./JamType";
import { LeaderboardType } from "./LeaderboardType";
import { ReactionType } from "./ReactionType";
import { RatingCategoryType } from "./RatingCategoryType";
import { RatingType } from "./RatingType";
import { TeamType } from "./TeamType";
import { TrackType } from "./TrackType";

export type GameEmbedAspectRatio =
  | "16 / 9"
  | "16 / 10"
  | "21 / 9"
  | "4 / 3"
  | "5 / 4"
  | "1 / 1"
  | "3 / 2"
  | "2 / 3"
  | "3 / 4"
  | "9 / 16"
  | "10 / 16";

export interface GameType {
  id: number;
  slug: string;
  name: string;
  short: string;
  description?: string;
  thumbnail?: string;
  banner?: string;
  emotePrefix?: string | null;
  screenshots?: string[];
  trailerUrl?: string | null;
  itchEmbedUrl?: string | null;
  itchEmbedAspectRatio?: GameEmbedAspectRatio | null;
  inputMethods?: string[];
  estOneRun?: string | null;
  estAnyPercent?: string | null;
  estHundredPercent?: string | null;
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
  gameEmotes?: ReactionType[];
  flags: FlagType[];
  tags: GameTagType[];
  comments: CommentType[];
  majRatingCategories: RatingCategoryType[];
  ratings: RatingType[];
  tracks: TrackType[];
  jamId: number;
  scores: {
    [name: string]: {
      placement: number;
      averageScore: number;
      averageUnrankedScore: number;
    };
  };
}
