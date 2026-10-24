import type { ReactNode } from "react";
import { useTranslations } from "@/compat/next-intl";
import { useTheme } from "@/providers/useSiteTheme";
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
  const t = useTranslations();
  const { colors } = useTheme();
  const currentIds = new Set(comments.map(comment => comment.id));
  const originalComments = postJam ? jamComments.filter(comment => !currentIds.has(comment.id)) : [];
  const heading = (label: string) => <div className="my-6 flex items-center gap-3 px-3 sm:px-0">
    <h2 className="shrink-0 text-sm font-semibold" style={{ color: colors.textFaded }}>{label}</h2>
    <div className="h-px flex-1" style={{ background: colors.base }} />
  </div>;
  const list = (items: CommentType[]) => <div className="flex flex-col gap-3">
    {[...items].sort((a, b) => b.id - a.id).map(comment => <CommentCard key={comment.id} comment={comment} user={user} edgeToEdge className={commentClassName} />)}
  </div>;
  return <>
    {originalComments.length > 0 && heading(t("AppStrings.PostJamVersionComments"))}
    {children}
    {list(comments)}
    {originalComments.length > 0 && <section>
      {heading(t("AppStrings.JamVersionComments"))}
      {list(originalComments)}
    </section>}
  </>;
}
