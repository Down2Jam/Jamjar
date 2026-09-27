// notificationtype.ts

import { CommentType } from "./CommentType";
import { TeamApplicationType } from "./TeamApplicationType";
import { TeamInviteType } from "./TeamInviteType";

export type NotificationKind =
  | "GENERAL"
  | "RATING_REMINDER"
  | "GAME_COMMENT"
  | "TRACK_COMMENT"
  | "COMMENT_REPLY"
  | "POST_COMMENT"
  | "FOLLOW"
  | "FOLLOW_BACK"
  | "TEAM_INVITE"
  | "TEAM_APPLICATION"
  | "LEADERBOARD_TOP_SPOT_LOST"
  | "LEADERBOARD_TOP_THREE_LOST"
  | "LEADERBOARD_TOP_FIVE_LOST"
  | "STREAM_LIVE";

export type NotificationData = {
  previewText?: string;
  badgeCount?: number;
  userSlug?: string;
  postSlug?: string;
  gameSlug?: string;
  trackSlug?: string;
  teamSlug?: string;
  [key: string]: unknown;
};

export interface NotificationType {
  id: number;
  type: NotificationKind;

  title?: string | null;
  body?: string | null;
  link?: string | null;
  data?: NotificationData | null;

  createdAt: Date;
  updatedAt: Date;

  actorId?: number | null;

  recipientId: number;

  // optional targets
  postId?: number | null;
  commentId?: number | null;
  gameId?: number | null;
  trackId?: number | null;
  teamId?: number | null;
  teamInviteId?: number | null;
  teamApplicationId?: number | null;

  teamApplication?: TeamApplicationType;
  teamInvite?: TeamInviteType;
  comment?: CommentType;
  game?: {
    id: number;
    slug: string;
    name?: string | null;
  } | null;
  post?: {
    id: number;
    slug: string;
    title?: string | null;
  } | null;
  track?: {
    id: number;
    slug: string;
    name?: string | null;
  } | null;
}
