import Editor from "../editor";
import { hasCookie } from "@/helpers/cookie";
import { postComment } from "@/requests/comment";
import { useId, useState } from "react";
import useMobileLayout from "@/hooks/useMobileLayout";
import MobileComposerDialog from "./MobileComposerDialog";
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
  const mobile = useMobileLayout();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = () => { if (!waitingPost) setOpen(false); };
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const { colors } = useTheme();

  const composer = (
    <div className={!mobile && size === "sm" ? styles.composer : undefined} style={{ "--comment-border": `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`, "--comment-focus": `color-mix(in srgb, ${colors.text} 20%, ${colors.mantle})` } as React.CSSProperties}>
      {(size === "sm" || mobile) && <div className="mb-3 flex items-center justify-between gap-3">
        {(size === "sm" || mobile) && <h2 id={titleId} className="text-base font-semibold">{size === "sm" ? "Leave a comment" : "Leave feedback"}</h2>}
        {mobile && <Button size="sm" variant="ghost" icon="x" aria-label="Close comment" disabled={waitingPost} onClick={close} />}
      </div>}
      {mobile && <p className="mb-2 text-xs font-medium">{size === "sm" ? "Your comment" : "Your feedback"}</p>}
      <fieldset disabled={waitingPost} className={waitingPost ? "pointer-events-none opacity-60" : ""}>
      <Editor
        content={content}
        setContent={setContent}
        size={mobile ? "xs" : size}
        format="markdown"
        showStats={false}
      />
      </fieldset>
      <div className={mobile ? "mt-3 flex justify-end gap-2" : size === "sm" ? styles.submitRow : ""}>
      {mobile && <Button size="sm" variant="ghost" disabled={waitingPost} onClick={close}>Cancel</Button>}
        <Button
          size={mobile ? "sm" : size}
          icon={mobile ? undefined : size === "sm" ? "send" : "plus"}
          color={mobile ? "blue" : "default"}
          disabled={waitingPost || (mobile && !content.trim())}
          aria-busy={waitingPost}
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

            try {
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
            } catch {
              addToast({ title: "Failed to post comment. Please try again." });
            } finally {
              setWaitingPost(false);
            }
          }}
        >
          {waitingPost ? <Spinner /> : size == "sm" ? "Post comment" : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );

  if (!mobile) return composer;
  return <>
    <Button size="sm" icon="send" fullWidth className="min-h-11" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      {size === "sm" ? "Leave a comment" : "Leave feedback"}
    </Button>
    <MobileComposerDialog open={open} onClose={close}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}>{composer}</div>
    </MobileComposerDialog>
  </>;
}
