import Editor from "../editor";
import { hasCookie } from "@/helpers/cookie";
import { postComment } from "@/requests/comment";
import { useState } from "react";
import { Button } from "bioloom-ui";
import { addToast } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import styles from "./style.module.css";

// CreateComment.tsx
export default function CreateComment({
  gameId,
  gamePageId,
  trackId,
  size = "sm",
}: {
  gameId?: number | null;
  gamePageId?: number | null;
  trackId?: number | null;
  size?: "xs" | "sm";
}) {
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const { colors } = useTheme();

  return (
    <div className={size === "sm" ? styles.composer : undefined} style={{ "--comment-border": `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`, "--comment-focus": colors.blue } as React.CSSProperties}>
      {size === "sm" && <h2 className="mb-3 text-base font-semibold">Leave a comment</h2>}
      <Editor
        content={content}
        setContent={setContent}
        size={size}
        format="markdown"
        showStats={false}
      />
      <div className={size === "sm" ? "mt-3 flex justify-start" : ""}>
      {waitingPost ? (
        <Spinner />
      ) : (
        <Button
          size={size}
          icon={size === "sm" ? "send" : "plus"}
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
              null,
              gameId ?? null,
              gamePageId ?? null,
              trackId ?? null
            );

            if (response.status === 401) {
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
              window.location.reload(); // Consider improving this too
            } else {
              addToast({
                title: "An error occurred",
              });
              setWaitingPost(false);
            }
          }}
        >
          {size == "sm" ? "Post comment" : "Submit Feedback"}
        </Button>
      )}
      </div>
    </div>
  );
}
