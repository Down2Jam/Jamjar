import { GameType } from "./GameType";
import { PostType } from "./PostType";
import { UserType } from "./UserType";

export interface CommentType {
  id: number;
  content: string;
  children: CommentType[];
  author: UserType;
  createdAt: Date;
  likes: [];
  hasLiked: boolean;
  game?: GameType;
  post?: PostType;
}
