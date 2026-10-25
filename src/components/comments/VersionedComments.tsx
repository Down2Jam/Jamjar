import type { ReactNode } from "react";
import CommentCard from "@/components/posts/CommentCard";
import type { CommentType } from "@/types/CommentType";
import type { UserType } from "@/types/UserType";

export default function VersionedComments({ comments, jamComments = [], postJam, user, children, commentClassName }: {
  comments: CommentType[];
  jamComments?: CommentType[];
  postJam: boolean;
  user?: UserType | null;
  children: ReactNode;
  commentClassName?: string;
}) {
  const currentIds = new Set(comments.map(comment => comment.id));
  const originalComments = postJam ? jamComments.filter(comment => !currentIds.has(comment.id)) : [];
  const list = (items: CommentType[]) => <div className="flex flex-col gap-3">
    {[...items].sort((a, b) => b.id - a.id).map(comment => <CommentCard key={comment.id} comment={comment} user={user} edgeToEdge className={commentClassName} />)}
  </div>;
  return <>
    {children}
    {list(comments)}
    {originalComments.length > 0 && <div className="mt-3">
      {list(originalComments)}
    </div>}
  </>;
}
