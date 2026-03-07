import { CommentType } from "./CommentType";
import { TagType } from "./TagType";
import { UserType } from "./UserType";
import { ReactionSummaryType } from "./ReactionType";

export interface PostType {
  id: number;
  slug: string;
  title: string;
  sticky: boolean;
  content: string;
  author: UserType;
  createdAt: Date;
  editedAt?: Date | null;
  deletedAt?: Date | null;
  removedAt?: Date | null;
  comments: CommentType[];
  tags: TagType[];
  likes: [];
  hasLiked: boolean;
  reactions?: ReactionSummaryType[];
}
