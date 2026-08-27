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

export interface GameReleaseFeedItemType {
  kind: "game_release";
  id: string;
  createdAt: Date;
  creators: Array<
    Pick<UserType, "id" | "slug" | "name" | "profilePicture">
  >;
  game: {
    id: number;
    slug: string;
    name: string;
    short?: string | null;
    thumbnail?: string | null;
  };
}

export type ForumFeedItemType = PostType | GameReleaseFeedItemType;

export function isGameReleaseFeedItem(
  item: ForumFeedItemType
): item is GameReleaseFeedItemType {
  return "kind" in item && item.kind === "game_release";
}
