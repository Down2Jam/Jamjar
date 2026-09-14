import { useTranslations } from "@/compat/next-intl";
import { CommentType } from "@/types/CommentType";
import { MoreVertical } from "lucide-react";
import Link from "@/compat/next-link";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Editor from "../editor";
import LikeButton from "./LikeButton";
import {
  deleteComment,
  getCommentReplies,
  updateComment,
} from "@/requests/comment";
import { Card } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import ThemedProse from "../themed-prose";
import { Avatar } from "bioloom-ui";
import { addToast } from "bioloom-ui";
import { Text } from "bioloom-ui";
import MentionedContent from "../mentions/MentionedContent";
import { Dropdown } from "bioloom-ui";
import { UserType } from "@/types/UserType";
import ContentStatusMeta from "./ContentStatusMeta";
import CommentReactions from "./CommentReactions";
import CommentReplyPopover from "./CommentReplyPopover";
import { UserHoverPreview } from "@/components/hover-previews";

export default function CommentCard({
  comment,
  user,
  onOverlayChange,
  edgeToEdge = false,
  className = "",
}: {
  className?: string;
  edgeToEdge?: boolean;
  comment: CommentType;
  user?: UserType | null;
  onOverlayChange?: (open: boolean) => void;
}) {
  const t = useTranslations();
  const [currentComment, setCurrentComment] = useState<CommentType>(comment);
  const [creatingReply, setCreatingReply] = useState<boolean>(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(comment.content);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [descendantOverlayOpen, setDescendantOverlayOpen] = useState(false);
  const [actionsLayerOpen, setActionsLayerOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors } = useTheme();
  const overlayOpen = creatingReply || reactionsOpen || descendantOverlayOpen;
  const canSeeModerated = Boolean(user?.mod || user?.admin);
  const isModerated = Boolean(
    currentComment.deletedAt || currentComment.removedAt
  );
  const isAuthor = user?.slug === currentComment.author.slug;
  const childComments = currentComment.children ?? [];

  useEffect(() => {
    setCurrentComment(comment);
    setDraftContent(comment.content);
  }, [comment]);

  useEffect(() => {
    onOverlayChange?.(overlayOpen);
  }, [onOverlayChange, overlayOpen]);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (overlayOpen) {
      setActionsLayerOpen(true);
      return;
    }

    closeTimerRef.current = setTimeout(() => {
      setActionsLayerOpen(false);
      closeTimerRef.current = null;
    }, 220);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [overlayOpen]);

  const handleDescendantOverlayChange = useCallback((open: boolean) => {
    setDescendantOverlayOpen(open);
  }, []);

  if (isModerated && !canSeeModerated) {
    return null;
  }

  return (
    <div
      id={`comment-${currentComment.id}`}
      className={`relative overflow-visible ${actionsLayerOpen ? "z-50" : "z-0"}`}
    >
      <Card
        className={`${edgeToEdge ? "max-lg:!rounded-none" : ""} ${className}`}
        style={{
          "--post-action-surface": `color-mix(in srgb, ${colors["mantle"]} 70%, ${colors["crust"]})`,
          "--post-action-hover": colors["base"],
          "--reaction-red": colors["red"],
          "--reaction-orange": colors["orange"],
          "--reaction-yellow": colors["yellow"],
          "--reaction-green": colors["green"],
          "--reaction-blue": colors["blue"],
          "--reaction-purple": colors["purple"],
          "--reaction-pink": colors["pink"],
          "--reaction-gray": colors["gray"],
        } as CSSProperties}
      >
      <div>
        <div
          className="flex items-center gap-3 text-xs pt-1"
          style={{
            color: colors["textFaded"],
          }}
        >
          <Text size="xs" color="textFaded">
            PostCard.By
          </Text>
          <UserHoverPreview user={currentComment.author} portal>
          <Link
            href={`/u/${currentComment.author.slug}`}
            className="flex items-center gap-2"
          >
            <Avatar size={24} src={currentComment.author.profilePicture} />
            <p>{currentComment.author.name}</p>
          </Link>
          </UserHoverPreview>
          <ContentStatusMeta
            createdAt={currentComment.createdAt}
            editedAt={currentComment.editedAt}
            deletedAt={currentComment.deletedAt}
            removedAt={currentComment.removedAt}
          />
        </div>

        {editing ? (
          <div className="p-4">
            <Editor
              content={draftContent}
              setContent={setDraftContent}
              format="markdown"
            />
            <div className="mt-2 flex gap-2">
              <Button
                color="blue"
                onClick={async () => {
                  const response = await updateComment(currentComment.id, draftContent);
                  if (!response.ok) {
                    addToast({ title: t("AppStrings.FailedToUpdateComment") });
                    return;
                  }
                  const json = await response.json();
                  setCurrentComment((prev) => ({ ...prev, ...json.data }));
                  setEditing(false);
                }}
              >
                 {t("Settings.Save.Title")} </Button>
              <Button
                onClick={() => {
                  setDraftContent(currentComment.content);
                  setEditing(false);
                }}
              >
                 {t("AppStrings.Cancel")} </Button>
            </div>
          </div>
        ) : isModerated ? (
          <div className="p-4">
            <Text color="textFaded" size="sm">
              {currentComment.removedAt
                ? t("AppStrings.ThisCommentWasRemoved")
                : t("AppStrings.ThisCommentWasDeleted")}
            </Text>
          </div>
        ) : (
          <ThemedProse className="px-4 pb-1 pt-4">
            <MentionedContent
              html={currentComment.content}
              className="!duration-250 !ease-linear !transition-all max-w-full break-words"
            />
          </ThemedProse>
        )}

        {!isModerated && <div className="mt-1 flex flex-wrap items-center gap-1">
          <LikeButton
            likes={currentComment.likes.length}
            liked={currentComment.hasLiked}
            parentId={currentComment.id}
            isComment
          />

          <CommentReplyPopover
            comment={currentComment}
            onOpenChange={setCreatingReply}
            onPosted={async () => {
              const response = await getCommentReplies(currentComment.id);
              if (!response.ok) throw new Error("Failed to refresh replies");
              const { data } = await response.json();
              if (!Array.isArray(data)) throw new Error("Invalid replies");
              setCurrentComment((previous) => ({ ...previous, children: data }));
            }}
          />
          <CommentReactions
            commentId={currentComment.id}
            reactions={currentComment.reactions}
            onOverlayChange={setReactionsOpen}
          />
          {(isAuthor || user?.mod || user?.admin) && (
            <div className="relative z-30 ml-auto">
              <Dropdown
                trigger={
                  <Button
                    className="post-action-button post-card-corner-button"
                    variant="ghost"
                    size="sm"
                  >
                    <MoreVertical size={16} />
                  </Button>
                }
              >
              {isAuthor ? (
                <Dropdown.Item
                  icon="squarepen"
                  onClick={() => setEditing(true)}
                >
                   {t("ThemeSuggestions.Edit.Title")} </Dropdown.Item>
              ) : null}
              {isAuthor ? (
                <Dropdown.Item
                  icon="trash"
                  onClick={async () => {
                    const response = await deleteComment(currentComment.id);
                    if (!response.ok) {
                      addToast({ title: t("AppStrings.FailedToDeleteComment") });
                      return;
                    }
                    setCurrentComment((prev) => ({
                      ...prev,
                      deletedAt: new Date(),
                    }));
                  }}
                >
                   {t("ThemeSuggestions.Delete.Title")} </Dropdown.Item>
              ) : null}
              {user?.mod || user?.admin ? (
                <Dropdown.Item
                  icon="shieldx"
                  onClick={async () => {
                    const response = await deleteComment(currentComment.id, "remove");
                    if (!response.ok) {
                      addToast({ title: t("AppStrings.FailedToRemoveComment") });
                      return;
                    }
                    setCurrentComment((prev) => ({
                      ...prev,
                      removedAt: new Date(),
                    }));
                  }}
                >
                   {t("PostCard.Remove.Title")} </Dropdown.Item>
              ) : null}
              </Dropdown>
            </div>
          )}
        </div>}

        {childComments.length > 0 &&
          (childComments[0].author ? (
            <div className="mt-3 flex flex-col gap-3">
              {childComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  user={user}
                  onOverlayChange={handleDescendantOverlayChange}
                />
              ))}
            </div>
          ) : (
            <Button
              disabled={loadingReplies}
              aria-busy={loadingReplies}
              onClick={async () => {
                if (loadingReplies) return;
                const commentId = currentComment.id;
                setLoadingReplies(true);
                try {
                  const response = await getCommentReplies(commentId);
                  if (!response.ok) throw new Error("Failed to load replies");
                  const { data } = await response.json();
                  if (!Array.isArray(data)) throw new Error("Invalid replies");
                  setCurrentComment((previous) => previous.id === commentId
                    ? { ...previous, children: data }
                    : previous);
                } catch {
                  addToast({ title: t("AppStrings.FailedToLoadRepliesPleaseTryAgain") });
                } finally {
                  setLoadingReplies(false);
                }
              }}
            >
              {loadingReplies ? t("AppStrings.LoadingReplies") : t("AppStrings.LoadReplies")}
            </Button>
          ))}
      </div>
      </Card>
    </div>
  );
}
