import { CommentType } from "@/types/CommentType";
import { formatDistance } from "date-fns";
import { LoaderCircle, Reply } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Editor from "../editor";
import { toast } from "react-toastify";
import { hasCookie } from "@/helpers/cookie";
import LikeButton from "./LikeButton";
import { postComment } from "@/requests/comment";
import { sanitize } from "@/helpers/sanitize";
import { Card } from "@/framework/Card";
import { Button } from "@/framework/Button";
import { useTheme } from "@/providers/SiteThemeProvider";
import ThemedProse from "../themed-prose";
import { Avatar } from "@/framework/Avatar";

export default function CommentCard({ comment }: { comment: CommentType }) {
  const [creatingReply, setCreatingReply] = useState<boolean>(false);
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const { colors } = useTheme();

  return (
    <Card>
      <div>
        <div
          className="flex items-center gap-3 text-xs pt-1"
          style={{
            color: colors["textFaded"],
          }}
        >
          <p>By</p>
          <Link
            href={`/u/${comment.author.slug}`}
            className="flex items-center gap-2"
          >
            <Avatar className="w-6 h-6" src={comment.author.profilePicture} />
            <p>{comment.author.name}</p>
          </Link>
          <p>
            {formatDistance(new Date(comment.createdAt), new Date(), {
              addSuffix: true,
            })}
          </p>
        </div>

        <ThemedProse className="p-4">
          <div
            className="!duration-250 !ease-linear !transition-all max-w-full break-words"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
        </ThemedProse>

        <div className="flex gap-3 mb-4">
          <LikeButton
            likes={comment.likes.length}
            liked={comment.hasLiked}
            parentId={comment.id}
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
        </div>

        {creatingReply && (
          <>
            <Editor content={content} setContent={setContent} />
            <div id="create-comment" className="mt-2" />
            <Button
              onClick={async () => {
                if (!content) {
                  toast.error("Please enter valid content");
                  return;
                }

                if (!hasCookie("token")) {
                  toast.error("You are not logged in");
                  return;
                }

                const sanitizedHtml = sanitize(content);
                setWaitingPost(true);

                const response = await postComment(
                  sanitizedHtml,
                  null,
                  comment!.id
                );

                if (response.status == 401) {
                  toast.error("Invalid User");
                  setWaitingPost(false);
                  return;
                }

                if (response.ok) {
                  toast.success("Successfully created comment");
                  setWaitingPost(false);
                  window.location.reload();
                } else {
                  toast.error("An error occured");
                  setWaitingPost(false);
                }
              }}
            >
              {waitingPost ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <p>Create Reply</p>
              )}
            </Button>
            <div className="p-2" />
          </>
        )}

        {comment.children.length > 0 &&
          (comment.children[0].author ? (
            <div className="flex flex-col gap-3">
              {comment.children.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <Button
              onClick={() => {
                toast.warning("Feature coming soon");
              }}
            >
              Load replies
            </Button>
          ))}
      </div>
    </Card>
  );
}
