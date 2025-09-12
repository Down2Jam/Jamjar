// notificationtype.ts

import { CommentType } from "./CommentType";
import { TeamApplicationType } from "./TeamApplicationType";
import { TeamInviteType } from "./TeamInviteType";

export type NotificationKind =
  | "GENERAL"
  | "GAME_COMMENT"
  | "COMMENT_REPLY"
  | "POST_COMMENT"
  | "FOLLOW"
  | "FOLLOW_BACK"
  | "TEAM_INVITE"
  | "TEAM_APPLICATION";

export type NotificationData = {
  previewText?: string;
  badgeCount?: number;
  userSlug?: string;
  postSlug?: string;
  gameSlug?: string;
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
  teamId?: number | null;
  teamInviteId?: number | null;
  teamApplicationId?: number | null;

  teamApplication?: TeamApplicationType;
  teamInvite?: TeamInviteType;
  comment?: CommentType;
}
