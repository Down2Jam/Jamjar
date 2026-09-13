import { useEffect, useId, useRef, useState } from "react";
import { Avatar, Button, Popover, Spinner, addToast } from "bioloom-ui";
import { Reply, X } from "lucide-react";
import { hasCookie } from "@/helpers/cookie";
import { postComment } from "@/requests/comment";
import { useTheme } from "@/providers/useSiteTheme";
import type { CommentType } from "@/types/CommentType";
import Editor from "../editor";
import useMobileLayout from "@/hooks/useMobileLayout";
import MobileComposerDialog from "../create-comment/MobileComposerDialog";
import MentionedContent from "../mentions/MentionedContent";
import ThemedProse from "../themed-prose";

export default function CommentReplyPopover({ comment, onOpenChange, onPosted }: {
  comment: CommentType;
  onOpenChange: (open: boolean) => void;
  onPosted: () => Promise<void>;
}) {
  const mobile = useMobileLayout();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const id = useId();
  const { colors } = useTheme();

  const close = () => {
    if (submitting.current) return;
    setOpen(false);
    anchor.current?.querySelector("button")?.focus();
  };

  useEffect(() => {
    onOpenChange(open);
    return () => onOpenChange(false);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || mobile) return;
    const update = () => setRect(anchor.current?.getBoundingClientRect() ?? null);
    const outside = (event: PointerEvent) => {
      if (!submitting.current && !anchor.current?.contains(event.target as Node) && !panel.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) close();
    };
    update();
    const focusFrame = requestAnimationFrame(() => panel.current?.focus());
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, mobile]);

  const submit = async () => {
    if (submitting.current || !content.trim()) return;
    if (!hasCookie("token")) {
      addToast({ title: "Please log in to reply" });
      return;
    }
    submitting.current = true;
    setPosting(true);
    try {
      const response = await postComment(content, null, comment.id);
      if (!response.ok) {
        addToast({ title: response.status === 401 ? "Please log in to reply" : "Failed to post reply. Please try again." });
        return;
      }
      setContent("");
      setOpen(false);
      anchor.current?.querySelector("button")?.focus();
      addToast({ title: "Reply posted" });
      try {
        await onPosted();
      } catch {
        addToast({ title: "Your reply was posted. Refresh the page to see it." });
      }
    } catch {
      addToast({ title: "Failed to post reply. Please try again." });
    } finally {
      submitting.current = false;
      setPosting(false);
    }
  };

  const replyForm = (
      <div
        ref={panel}
        id={id}
        role="dialog"
        aria-modal={mobile || undefined}
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        className={mobile ? "w-full outline-none" : "w-[440px] max-w-[calc(100vw-50px)] max-h-[75dvh] overflow-y-auto outline-none"}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={`${id}-title`} className="text-sm font-semibold">Reply to {comment.author.name}</h2>
          <Button size="sm" variant="ghost" className="!h-7 !w-7 !min-w-0 !p-0" aria-label="Close reply" disabled={posting} onClick={close}>
            <X size={16} aria-hidden="true" />
          </Button>
        </div>
        <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: colors["base"] }}>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium">
            <Avatar size={20} src={comment.author.profilePicture} />
            <span>{comment.author.name}</span>
          </div>
          <ThemedProse className="max-h-24 overflow-y-auto text-sm [&_p]:my-1 [&_img]:max-h-20">
            <MentionedContent html={comment.content} className="break-words" />
          </ThemedProse>
        </div>
        <p className="mb-2 text-xs font-medium">Your reply</p>
        <fieldset disabled={posting} className={posting ? "pointer-events-none opacity-60" : ""}>
          <Editor content={content} setContent={setContent} format="markdown" size="xs" showStats={false} />
        </fieldset>
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="ghost" disabled={posting} onClick={close}>Cancel</Button>
          <Button size="sm" color="blue" disabled={posting || !content.trim()} aria-busy={posting} onClick={submit}>
            {posting ? <Spinner /> : "Post reply"}
          </Button>
        </div>
      </div>
  );

  return <div ref={anchor}>
    <Button
      className="post-action-button min-w-12"
      size="sm"
      variant="ghost"
      leftSlot={<Reply size={16} aria-hidden="true" />}
      aria-label="Reply"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? id : undefined}
      onClick={() => {
        if (open) close();
        else {
          setRect(anchor.current?.getBoundingClientRect() ?? null);
          setOpen(true);
        }
      }}
    />
    {mobile ? <MobileComposerDialog open={open} onClose={close}>{replyForm}</MobileComposerDialog> : rect && <Popover
      shown={open}
      anchorToScreen
      position="bottom"
      showArrow={false}
      surface="contrast"
      padding={16}
      disableHoverScale
      positionerStyle={{ position: "fixed", left: rect.left, top: rect.bottom + 8, zIndex: 90 }}
    >
      {replyForm}
    </Popover>}
  </div>;
}
