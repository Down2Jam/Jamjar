"use client";

import { Card } from "@/framework/Card";
import { Vstack, Hstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import Icon, { IconName } from "@/framework/Icon";
import { Button } from "@/framework/Button";
import { NotificationType } from "@/types/NotificationType";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import Editor from "@/components/editor";
import { sanitize } from "@/helpers/sanitize";
import { hasCookie } from "@/helpers/cookie";
import { addToast } from "@heroui/react";
import { Spinner } from "@/framework/Spinner";
import { postComment } from "@/requests/comment";
import ThemedProse from "@/components/themed-prose";

type Props = {
  notification: NotificationType;
  onMarkRead: (notificationId: number) => Promise<void> | void;
};

function getDescriptor(n: NotificationType) {
  const c = n.comment;
  const type = n.type;

  if (type === "GAME_COMMENT" && c?.game?.slug) {
    return {
      title: "New comment on your game",
      icon: "messagecircle",
      subtitle: `${c.author?.name ?? "Someone"} commented on ${
        c.game.name ?? "your game"
      }`,
      href: `/g/${c.game.slug}?comment=${c.id}#comment-${c.id}`,
    };
  }

  if (type === "POST_COMMENT" && c?.post?.slug) {
    return {
      title: "New comment on your post",
      icon: "messagecircle",
      subtitle: `${c.author?.name ?? "Someone"} commented on ${c.post.title}`,
      href: `/p/${c.post.slug}?comment=${c.id}#comment-${c.id}`,
    };
  }

  return {
    title: "a",
    icon: "messagecircle",
    subtitle: `b`,
    href: `/`,
  };

  // return {
  //   title: "New reply to your comment",
  //   icon: "reply",
  //   subtitle: `${c?.author?.name ?? "Someone"} replied to your comment`,
  //   href:
  //     (c?.threadRoot?.targetGame?.slug &&
  //       `/g/${c.threadRoot.targetGame.slug}?comment=${c.id}#comment-${c.id}`) ||
  //     (c?.threadRoot?.targetPost?.slug &&
  //       `/p/${c.threadRoot.targetPost.slug}?comment=${c.id}#comment-${c.id}`) ||
  //     `#comment-${c?.id ?? ""}`,
  // };
}

export default function CommentNotification({
  notification,
  onMarkRead,
}: Props) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const c = notification.comment;

  console.log(c);

  if (!c) return null;

  const { title, icon, subtitle, href } = getDescriptor(notification);

  return (
    <Card className="min-w-96">
      <Vstack align="start" gap={3}>
        <Link href={href} className="w-full">
          <Hstack className="w-full justify-between">
            <Hstack>
              <Icon name={icon as IconName} color="text" size={16} />
              <Text size="lg" weight="semibold">
                {title}
              </Text>
            </Hstack>
          </Hstack>
        </Link>

        <Text size="xs" color="textFaded">
          {subtitle}
        </Text>

        <ThemedProse className="p-4">
          <div
            className="!duration-250 !ease-linear !transition-all max-w-full break-words"
            dangerouslySetInnerHTML={{ __html: c.content }}
          />
        </ThemedProse>

        <Hstack wrap>
          <Button icon="reply" onClick={() => setReplyOpen((o) => !o)}>
            {replyOpen ? "Cancel Reply" : "Reply"}
          </Button>

          <Link href={href}>
            <Button icon="arrowright">Go to comment</Button>
          </Link>

          <Button
            icon="check"
            color="green"
            onClick={() => onMarkRead(notification.id)}
          >
            Mark as read
          </Button>
        </Hstack>

        {replyOpen && (
          <Vstack className="w-full" align="start">
            <Editor content={content} setContent={setContent} />
            <Hstack>
              <Button
                onClick={async () => {
                  if (!content) {
                    addToast({ title: "Please enter valid content" });
                    return;
                  }
                  if (!hasCookie("token")) {
                    addToast({ title: "You are not logged in" });
                    return;
                  }
                  try {
                    setPosting(true);
                    const sanitized = sanitize(content);
                    const res = await postComment(sanitized, null, c.id);
                    setPosting(false);

                    if (res.ok) {
                      addToast({ title: "Reply posted" });
                      setReplyOpen(false);
                      setContent("");
                      onMarkRead(notification.id);
                    } else {
                      addToast({ title: "Failed to post reply" });
                    }
                  } catch (e) {
                    setPosting(false);
                    addToast({ title: "An error occurred" });
                    console.error(e);
                  }
                }}
              >
                {posting ? <Spinner /> : "Post reply"}
              </Button>
            </Hstack>
          </Vstack>
        )}

        {/* Timestamp */}
        <Hstack>
          <Icon name="clock" color="textFaded" size={12} />
          <Text size="xs" color="textFaded" className="opacity-50">
            {new Date(notification.createdAt).toLocaleString()}
          </Text>
          <Text size="xs" color="textFaded" className="opacity-50">
            -
          </Text>
          <Text size="xs" color="textFaded" className="opacity-50">
            {formatDistance(new Date(notification.createdAt), new Date(), {
              addSuffix: true,
            })}
          </Text>
        </Hstack>
      </Vstack>
    </Card>
  );
}
