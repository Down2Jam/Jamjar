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

export type PageVersion = "JAM" | "POST_JAM";
export type ListingPageVersion = PageVersion | "ALL";

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
  pageVersion?: PageVersion;
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
  jamPage?: GamePageType | null;
  postJamPage?: GamePageType | null;
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
  jamScores?: {
    [name: string]: {
      placement: number;
      averageScore: number;
      averageUnrankedScore: number;
    };
  };
  postJamScores?: {
    [name: string]: {
      placement: number;
      averageScore: number;
      averageUnrankedScore: number;
    };
  };
  scores?: {
    [name: string]: {
      placement: number;
      averageScore: number;
      averageUnrankedScore: number;
    };
  };
}

export interface GamePageType {
  id: number;
  version: PageVersion;
  name: string;
  short: string;
  description?: string;
  thumbnail?: string | null;
  banner?: string | null;
  ratingCategories: RatingCategoryType[];
  majRatingCategories: RatingCategoryType[];
  themeJustification: string;
  achievements: AchievementType[];
  flags: FlagType[];
  tags: GameTagType[];
  leaderboards: LeaderboardType[];
  tracks: TrackType[];
  screenshots: string[];
  trailerUrl?: string | null;
  itchEmbedUrl?: string | null;
  itchEmbedAspectRatio?: GameEmbedAspectRatio | null;
  inputMethods?: string[];
  estOneRun?: string | null;
  estAnyPercent?: string | null;
  estHundredPercent?: string | null;
  emotePrefix?: string | null;
  downloadLinks: DownloadLinkType[];
  comments: CommentType[];
}
