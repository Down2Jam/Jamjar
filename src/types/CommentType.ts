import { GameType } from "./GameType";
import { PostType } from "./PostType";
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
  game?: GameType;
  post?: PostType;
  comment?: CommentType;
}
