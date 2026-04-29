import { CommentType } from "@/types/CommentType";
import { MoreVertical, Reply } from "lucide-react";
import Link from "@/compat/next-link";
import { useEffect, useState } from "react";
import Editor from "../editor";
import { hasCookie } from "@/helpers/cookie";
import LikeButton from "./LikeButton";
import {
  deleteComment,
  postComment,
  updateComment,
} from "@/requests/comment";
import { Card } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import ThemedProse from "../themed-prose";
import { Avatar } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { addToast } from "bioloom-ui";
import { Text } from "bioloom-ui";
import MentionedContent from "../mentions/MentionedContent";
import { Dropdown } from "bioloom-ui";
import { UserType } from "@/types/UserType";
import ContentStatusMeta from "./ContentStatusMeta";
import CommentReactions from "./CommentReactions";

export default function CommentCard({
  comment,
  user,
}: {
  comment: CommentType;
  user?: UserType | null;
}) {
  const [currentComment, setCurrentComment] = useState<CommentType>(comment);
  const [creatingReply, setCreatingReply] = useState<boolean>(false);
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(comment.content);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const { colors } = useTheme();
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

  if (isModerated && !canSeeModerated) {
    return null;
  }

  return (
    <div id={`comment-${currentComment.id}`}>
      <Card>
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
          <Link
            href={`/u/${currentComment.author.slug}`}
            className="flex items-center gap-2"
          >
            <Avatar size={24} src={currentComment.author.profilePicture} />
            <p>{currentComment.author.name}</p>
          </Link>
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
                    addToast({ title: "Failed to update comment" });
                    return;
                  }
                  const json = await response.json();
                  setCurrentComment((prev) => ({ ...prev, ...json.data }));
                  setEditing(false);
                }}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setDraftContent(currentComment.content);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : isModerated ? (
          <div className="p-4">
            <Text color="textFaded" size="sm">
              {currentComment.removedAt
                ? "This comment was removed."
                : "This comment was deleted."}
            </Text>
          </div>
        ) : (
          <ThemedProse className="p-4">
            <MentionedContent
              html={currentComment.content}
              className="!duration-250 !ease-linear !transition-all max-w-full break-words"
            />
          </ThemedProse>
        )}

        {!isModerated && <div className="flex gap-3 mb-4">
          <LikeButton
            likes={currentComment.likes.length}
            liked={currentComment.hasLiked}
            parentId={currentComment.id}
            isComment
          />

          <Button
            size="sm"
            onClick={() => {
              setCreatingReply(!creatingReply);
            }}
          >
            <Reply size={16} />
          </Button>
          <CommentReactions
            commentId={currentComment.id}
            reactions={currentComment.reactions}
            onOverlayChange={setReactionsOpen}
          />
          {(isAuthor || user?.mod || user?.admin) && (
            <Dropdown
              trigger={
                <Button size="sm">
                  <MoreVertical size={16} />
                </Button>
              }
            >
              {isAuthor ? (
                <Dropdown.Item
                  icon="squarepen"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Dropdown.Item>
              ) : null}
              {isAuthor ? (
                <Dropdown.Item
                  icon="trash"
                  onClick={async () => {
                    const response = await deleteComment(currentComment.id);
                    if (!response.ok) {
                      addToast({ title: "Failed to delete comment" });
                      return;
                    }
                    setCurrentComment((prev) => ({
                      ...prev,
                      deletedAt: new Date(),
                    }));
                  }}
                >
                  Delete
                </Dropdown.Item>
              ) : null}
              {user?.mod || user?.admin ? (
                <Dropdown.Item
                  icon="shieldx"
                  onClick={async () => {
                    const response = await deleteComment(currentComment.id, "remove");
                    if (!response.ok) {
                      addToast({ title: "Failed to remove comment" });
                      return;
                    }
                    setCurrentComment((prev) => ({
                      ...prev,
                      removedAt: new Date(),
                    }));
                  }}
                >
                  Remove
                </Dropdown.Item>
              ) : null}
            </Dropdown>
          )}
        </div>}

        {creatingReply && !isModerated && (
          <>
            <Editor
              content={content}
              setContent={setContent}
              format="markdown"
            />
            <div id="create-comment" className="mt-2" />
            <Button
              onClick={async () => {
                if (!content) {
                  addToast({
                    title: "Please enter valid content",
                  });
                  return;
                }

                if (!hasCookie("token")) {
                  addToast({
                    title: "You are not logged in",
                  });
                  return;
                }

                setWaitingPost(true);

                const response = await postComment(
                  content,
                  null,
                  currentComment.id
                );

                if (response.status == 401) {
                  addToast({
                    title: "Invalid User",
                  });
                  setWaitingPost(false);
                  return;
                }

                if (response.ok) {
                  addToast({
                    title: "Successfully created comment",
                  });
                  setWaitingPost(false);
                  window.location.reload();
                } else {
                  addToast({
                    title: "An error occured",
                  });
                  setWaitingPost(false);
                }
              }}
            >
              {waitingPost ? <Spinner /> : <p>Create Reply</p>}
            </Button>
            <div className="p-2" />
          </>
        )}

        {childComments.length > 0 &&
          (childComments[0].author ? (
            <div className="flex flex-col gap-3">
              {childComments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} user={user} />
              ))}
            </div>
          ) : (
            <Button
              onClick={() => {
                addToast({
                  title: "Feature coming soon",
                });
              }}
            >
              Load replies
            </Button>
          ))}
      </div>
      </Card>
    </div>
  );
}
