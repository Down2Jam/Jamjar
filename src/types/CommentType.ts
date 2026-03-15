import { GameType } from "./GameType";
import { PostType } from "./PostType";
import { ReactionSummaryType } from "./ReactionType";
import { TrackType } from "./TrackType";
import { UserType } from "./UserType";

export interface CommentType {
  id: number;
  content: string;
  children?: CommentType[];
  author: UserType;
  createdAt: Date;
  editedAt?: Date | null;
  deletedAt?: Date | null;
  removedAt?: Date | null;
  likes: [];
  hasLiked: boolean;
  reactions?: ReactionSummaryType[];
  game?: GameType;
  track?: TrackType;
  post?: PostType;
  comment?: CommentType;
}
