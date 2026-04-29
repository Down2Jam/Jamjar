import { AchievementType } from "./AchievementType";
import { CommentType } from "./CommentType";
import { JamType } from "./JamType";
import { NotificationType } from "./NotificationType";
import { PostType } from "./PostType";
import { RoleType } from "./RoleType";
import { ScoreType } from "./ScoreType";
import { TeamInviteType } from "./TeamInviteType";
import { TeamType } from "./TeamType";
import { TrackType } from "./TrackType";

export interface UserType {
  id: number;
  slug: string;
  name: string;
  bio: string;
  short: string;
  profilePicture: string;
  bannerPicture: string;
  profileBackground?: string | null;
  emotePrefix?: string | null;
  hideRatings?: boolean;
  autoHideRatingsWhileStreaming?: boolean;
  createdAt: Date;
  mod: boolean;
  admin: boolean;
  followingCount?: number;
  twitch: string;
  pronouns?: string | null;
  links?: string[];
  linkLabels?: string[];
  recommendedGames?: Array<{
    id: number;
    pageVersion?: "JAM" | "POST_JAM";
    name: string;
    slug: string;
    short?: string | null;
    thumbnail?: string | null;
    itchEmbedUrl?: string | null;
    category?: "ODA" | "REGULAR" | "EXTRA";
    downloadLinks?: Array<{
      id: number;
      url: string;
      platform: "Windows" | "MacOS" | "Linux" | "Web" | "Mobile" | "Other" | "SourceCode";
    }>;
    jam?: { id: number; name: string; color: string };
  }>;
  recommendedGameCandidates?: Array<{
    id: number;
    pageVersion?: "JAM" | "POST_JAM";
    name: string;
    slug: string;
    short?: string | null;
    thumbnail?: string | null;
    itchEmbedUrl?: string | null;
    category?: "ODA" | "REGULAR" | "EXTRA";
    downloadLinks?: Array<{
      id: number;
      url: string;
      platform: "Windows" | "MacOS" | "Linux" | "Web" | "Mobile" | "Other" | "SourceCode";
    }>;
    jam?: { id: number; name: string; color: string };
  }>;
  recommendedGameOverrideIds?: number[];
  recommendedGameHiddenIds?: number[];
  recommendedGameCandidateCount?: number;
  recommendedPosts?: Array<{
    id: number;
    title: string;
    slug: string;
  }>;
  recommendedTracks?: Array<{
    id: number;
    name: string;
    slug?: string;
    url: string;
    license?: string | null;
    allowDownload?: boolean;
    allowBackgroundUse?: boolean;
    allowBackgroundUseAttribution?: boolean;
    composer?: { name: string };
    game?: {
      name: string;
      slug: string;
      thumbnail?: string | null;
      jamId?: number;
    };
  }>;
  recommendedTrackCandidates?: Array<{
    id: number;
    name: string;
    slug?: string;
    url: string;
    license?: string | null;
    allowDownload?: boolean;
    allowBackgroundUse?: boolean;
    allowBackgroundUseAttribution?: boolean;
    composer?: { name: string };
    game?: {
      name: string;
      slug: string;
      thumbnail?: string | null;
      jamId?: number;
    };
  }>;
  recommendedTrackOverrideIds?: number[];
  recommendedTrackHiddenIds?: number[];
  recommendedTrackCandidateCount?: number;
  favoriteGameCounts?: Array<{
    gameId: number;
    pageVersion?: "JAM" | "POST_JAM";
    count: number;
    users: Array<{
      id: number;
      slug: string;
      name: string;
      profilePicture?: string | null;
    }>;
  }>;
  favoriteTrackCounts?: Array<{
    trackId: number;
    count: number;
    users: Array<{
      id: number;
      slug: string;
      name: string;
      profilePicture?: string | null;
    }>;
  }>;
  userEmotes?: Array<{
    id: number;
    slug: string;
    image: string;
    updatedAt: Date;
  }>;
  primaryRoles: RoleType[];
  secondaryRoles: RoleType[];
  teams: TeamType[];
  teamInvites: TeamInviteType[];
  ownedTeams: TeamType[];
  ratings: Array<{
    value: number;
    gameId: number;
    gamePageId?: number;
    categoryId: number;
    userId: number;
    pageVersion?: "JAM" | "POST_JAM";
    updatedAt?: Date;
    game: {
      jamId: number;
      ratingCategories: Array<{ id: number }>;
    };
  }>;
  trackRatings?: Array<{
    value: number;
    trackId: number;
    categoryId: number;
    userId: number;
    updatedAt?: Date;
  }>;
  tracks: TrackType[];
  achievements: AchievementType[];
  scores: ScoreType[];
  posts: PostType[];
  comments: CommentType[];
  receivedNotifications: NotificationType[];
  jams?: JamType[];
  email?: string;
}
