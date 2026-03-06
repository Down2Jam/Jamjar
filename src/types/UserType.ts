import { AchievementType } from "./AchievementType";
import { CommentType } from "./CommentType";
import { NotificationType } from "./NotificationType";
import { PostType } from "./PostType";
import { RatingType } from "./RatingType";
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
  createdAt: Date;
  mod: boolean;
  admin: boolean;
  twitch: string;
  pronouns?: string | null;
  links?: string[];
  linkLabels?: string[];
  recommendedGames?: Array<{
    id: number;
    name: string;
    slug: string;
    thumbnail?: string | null;
  }>;
  recommendedPosts?: Array<{
    id: number;
    title: string;
    slug: string;
  }>;
  recommendedTracks?: Array<{
    id: number;
    name: string;
    url: string;
    composer?: { name: string };
    game?: { name: string; slug: string; thumbnail?: string | null };
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
  ratings: RatingType[];
  tracks: TrackType[];
  achievements: AchievementType[];
  scores: ScoreType[];
  posts: PostType[];
  comments: CommentType[];
  receivedNotifications: NotificationType[];
}
