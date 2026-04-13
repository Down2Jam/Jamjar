import { GameType } from "./GameType";
import { CommentType } from "./CommentType";
import { UserType } from "./UserType";
import { TrackTagType } from "./TrackTagType";
import { TrackFlagType } from "./TrackFlagType";
import { PageVersion } from "./GameType";

export interface TrackType {
  id: number;
  pageVersion?: PageVersion;
  availablePageVersions?: PageVersion[];
  sourceTrackId?: number | null;
  slug: string;
  name: string;
  url: string;
  license?: string | null;
  allowDownload?: boolean;
  allowBackgroundUse?: boolean;
  allowBackgroundUseAttribution?: boolean;
  bpm?: number | null;
  musicalKey?: string | null;
  softwareUsed?: string[];
  commentary?: string | null;
  tags?: TrackTagType[];
  flags?: TrackFlagType[];
  links?: Array<{
    id: number;
    label: string;
    url: string;
  }>;
  credits?: Array<{
    id: number;
    role: string;
    userId: number;
    user: UserType;
  }>;
  composerId: number;
  composer: UserType;
  gameId: number;
  game: GameType;
  image?: string;
  comments?: CommentType[];
  timestampComments?: Array<{
    id: number;
    content: string;
    timestamp: number;
    createdAt?: Date;
    author: {
      id: number;
      slug: string;
      name: string;
      profilePicture?: string | null;
    };
  }>;
  ratings?: Array<{
    id: number;
    value: number;
    userId: number;
    categoryId: number;
  }>;
  viewerRating?: {
    id: number;
    value: number;
    userId: number;
    categoryId: number;
  } | null;
  scores?: {
    [name: string]: {
      placement: number;
      averageScore: number;
      averageUnrankedScore: number;
      ratingCount: number;
      rankedRatingCount: number;
      ratingsGivenCount: number;
    };
  };
}
