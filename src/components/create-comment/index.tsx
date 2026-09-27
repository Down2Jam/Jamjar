import { useTranslations } from "@/compat/next-intl";
import dynamic from "@/compat/next-dynamic";
const Editor = dynamic(() => import("../editor"), {
  loading: () => <div className="min-h-24 animate-pulse rounded-md bg-current/5" />,
});
import { hasCookie } from "@/helpers/cookie";
import { postComment } from "@/requests/comment";
import { addCollectionComment } from "@/requests/collection";
import { useId, useState } from "react";
import useMobileLayout from "@/hooks/useMobileLayout";
import MobileComposerDialog from "./MobileComposerDialog";
import { Button, Card } from "bioloom-ui";
import { addToast } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import styles from "./style.module.css";

// CreateComment.tsx
export default function CreateComment({
  postId,
  collectionId,
  onCreated,
  framed = false,
  gameId,
  gamePageId,
  trackId,
  size = "sm",
}: {
  postId?: number | null;
  collectionId?: number;
  onCreated?: () => void | Promise<void>;
  framed?: boolean;
  gameId?: number | null;
  gamePageId?: number | null;
  trackId?: number | null;
  size?: "xs" | "sm";
}) {
  const t = useTranslations();
  const mobile = useMobileLayout();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = () => { if (!waitingPost) setOpen(false); };
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const { colors } = useTheme();

  const composer = (
    <div className={!mobile && size === "sm" ? styles.composer : styles.feedback} style={{ "--comment-border": `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`, "--comment-focus": `color-mix(in srgb, ${colors.text} 20%, ${colors.mantle})` } as React.CSSProperties}>
      {(size === "sm" || mobile) && <div className="mb-3 flex items-center justify-between gap-3">
        {(size === "sm" || mobile) && <h2 id={titleId} className="text-base font-semibold">{size === "sm" ? t("AppStrings.LeaveAComment") : t("AppStrings.LeaveFeedback")}</h2>}
        {mobile && <Button size="sm" variant="ghost" icon="x" aria-label={t("AppStrings.CloseComment")} disabled={waitingPost} onClick={close} />}
      </div>}
      {mobile && <p className="mb-2 text-xs font-medium">{size === "sm" ? t("AppStrings.YourComment") : t("AppStrings.YourFeedback")}</p>}
      <fieldset disabled={waitingPost} className={waitingPost ? "pointer-events-none opacity-60" : ""}>
      <Editor
        content={content}
        setContent={setContent}
        size={mobile ? "xs" : size}
        format="markdown"
        showStats={false}
      />
      </fieldset>
      <div className={mobile ? "mt-3 flex justify-end gap-2" : size === "sm" ? styles.submitRow : "mt-3"}>
      {mobile && <Button size="sm" variant="ghost" disabled={waitingPost} onClick={close}>{t("AppStrings.Cancel")}</Button>}
        <Button
          size={mobile ? "sm" : size}
          icon={mobile ? undefined : size === "sm" ? "send" : "plus"}
          color={mobile ? "blue" : "default"}
          disabled={waitingPost || (mobile && !content.trim())}
          aria-busy={waitingPost}
          onClick={async () => {
            if (!content.trim()) {
              addToast({
                title: t("AppStrings.PleaseEnterValidContent"),
              });
              return;
            }

            if (!hasCookie("token")) {
              addToast({
                title: t("CreateGame.NotLogged"),
              });
              return;
            }

            setWaitingPost(true);

            try {
            const response = collectionId != null
              ? await addCollectionComment(collectionId, content)
              : await postComment(
              content,
              postId ?? null,
              null,
              gameId ?? null,
              gamePageId ?? null,
              trackId ?? null
            );

            if (response.status === 401) {
              addToast({
                title: t("AppStrings.InvalidUser2"),
              });
              setWaitingPost(false);
              return;
            }

            if (response.ok) {
              addToast({
                title: t("AppStrings.SuccessfullyCreatedComment"),
              });
              setWaitingPost(false);
              setContent("");
              setOpen(false);
              if (onCreated) await onCreated();
              else window.location.reload();
            } else {
              addToast({
                title: t("AppStrings.AnErrorOccurred"),
              });
              setWaitingPost(false);
            }
            } catch {
              addToast({ title: t("AppStrings.FailedToPostCommentPleaseTryAgain") });
            } finally {
              setWaitingPost(false);
            }
          }}
        >
          {waitingPost ? <Spinner /> : size == "sm" ? t("AppStrings.PostComment") : t("AppStrings.SubmitFeedback")}
        </Button>
      </div>
    </div>
  );

  if (!mobile) return framed ? (
    <Card padding={1.5} shadow="none" className="shadow-2xl w-full max-lg:!rounded-none">
      {composer}
    </Card>
  ) : composer;
  return <>
    <Button size="sm" icon="send" fullWidth className="min-h-11" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      {size === "sm" ? t("AppStrings.LeaveAComment") : t("AppStrings.LeaveFeedback")}
    </Button>
    <MobileComposerDialog open={open} onClose={close}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}>{composer}</div>
    </MobileComposerDialog>
  </>;
}
