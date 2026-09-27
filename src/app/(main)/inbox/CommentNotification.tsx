"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Card } from "bioloom-ui";
import { Vstack, Hstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Icon, IconName } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { NotificationType } from "@/types/NotificationType";
import { formatDistance } from "date-fns";
import Link from "@/compat/next-link";
import { getNotificationLink } from "@/helpers/notificationLink";
import { useState } from "react";
import Editor from "@/components/editor";
import { hasCookie } from "@/helpers/cookie";
import { addToast } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { postComment } from "@/requests/comment";
import ThemedProse from "@/components/themed-prose";
import MentionedContent from "@/components/mentions/MentionedContent";

type Props = {
  notification: NotificationType;
  onMarkRead: (notificationId: number) => Promise<void> | void;
};

function resolveCommentTarget(comment: NotificationType["comment"] | undefined | null) {
  let current = comment;

  while (current) {
    if (current.game || current.post || current.track) {
      return {
        game: current.game ?? null,
        post: current.post ?? null,
        track: current.track ?? null,
      };
    }
    current = current.comment;
  }

  return {
    game: null,
    post: null,
    track: null,
  };
}

function getDescriptor(n: NotificationType, t: ReturnType<typeof useUiTranslations>) {
  const uiText = t;
  const c = n.comment;
  const type = n.type;
  const resolvedTarget = resolveCommentTarget(c);
  const game = n.game ?? resolvedTarget.game ?? null;
  const post = n.post ?? resolvedTarget.post ?? null;
  const track = n.track ?? resolvedTarget.track ?? null;

  if (type === "GAME_COMMENT" && game?.slug) {
    return {
      title: "AppStrings.NewCommentOnYourGame",
      icon: "messagecircle",
      subtitle: uiText("AppStrings.Value0CommentedOnValue1", { value0: c?.author?.name ?? uiText("AppStrings.Someone"), value1: game.name ?? "your game" }),
      href: c
        ? `/g/${game.slug}?comment=${c.id}#comment-${c.id}`
        : `/g/${game.slug}`,
    };
  }

  if (type === "TRACK_COMMENT" && track?.slug) {
    return {
      title: "AppStrings.NewCommentOnYourTrack",
      icon: "music",
      subtitle: uiText("AppStrings.Value0CommentedOnValue1", { value0: c?.author?.name ?? uiText("AppStrings.Someone"), value1: track.name ?? "your track" }),
      href: c
        ? `/m/${track.slug}?comment=${c.id}#comment-${c.id}`
        : `/m/${track.slug}`,
    };
  }

  if (type === "POST_COMMENT" && post?.slug) {
    return {
      title: "AppStrings.NewCommentOnYourPost",
      icon: "messagecircle",
      subtitle: uiText("AppStrings.Value0CommentedOnValue1", { value0: c?.author?.name ?? uiText("AppStrings.Someone"), value1: post.title }),
      href: c
        ? `/p/${post.slug}?comment=${c.id}#comment-${c.id}`
        : `/p/${post.slug}`,
    };
  }

  if (type === "COMMENT_REPLY") {
    if (track?.slug) {
      return {
        title: "AppStrings.NewReplyToYourComment",
        icon: "reply",
        subtitle: uiText("AppStrings.Value0RepliedOnValue1", { value0: c?.author?.name ?? uiText("AppStrings.Someone"), value1: track.name ?? "your track" }),
        href: c
          ? `/m/${track.slug}?comment=${c.id}#comment-${c.id}`
          : `/m/${track.slug}`,
      };
    }

    if (game?.slug) {
      return {
        title: "AppStrings.NewReplyToYourComment",
        icon: "reply",
        subtitle: uiText("AppStrings.Value0RepliedOnValue1", { value0: c?.author?.name ?? uiText("AppStrings.Someone"), value1: game.name ?? "your game" }),
        href: c
          ? `/g/${game.slug}?comment=${c.id}#comment-${c.id}`
          : `/g/${game.slug}`,
      };
    }

    if (post?.slug) {
      return {
        title: "AppStrings.NewReplyToYourComment",
        icon: "reply",
        subtitle: uiText("AppStrings.Value0RepliedOnValue1", { value0: c?.author?.name ?? uiText("AppStrings.Someone"), value1: post.title }),
        href: c
          ? `/p/${post.slug}?comment=${c.id}#comment-${c.id}`
          : `/p/${post.slug}`,
      };
    }
  }

  return {
    title: "AppStrings.NewCommentActivity",
    icon: "messagecircle",
    subtitle: uiText("AppStrings.Value0RepliedToYourComment", { value0: c?.author?.name ?? uiText("AppStrings.Someone") }),
    href:
      getNotificationLink(n) ??
      (c ? `?comment=${c.id}#comment-${c.id}` : "/"),
  };
}

export default function CommentNotification({
  notification,
  onMarkRead,
}: Props) {
  const uiText = useUiTranslations();
  const [replyOpen, setReplyOpen] = useState(false);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const c = notification.comment;

  if (!c) return null;

  const { title, icon, subtitle, href } = getDescriptor(notification, uiText);

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
          <MentionedContent
            html={c.content}
            className="!duration-250 !ease-linear !transition-all max-w-full break-words"
          />
        </ThemedProse>

        <Hstack wrap>
          <Button icon="reply" onClick={() => setReplyOpen((o) => !o)}>
            {replyOpen ? uiText("AppStrings.CancelReply") : uiText("AppStrings.Reply")}
          </Button>

          <Link href={href}>
            <Button icon="arrowright">{uiText("AppStrings.GoToComment")}</Button>
          </Link>

          <Button
            icon="check"
            color="green"
            onClick={() => onMarkRead(notification.id)}
          >
             {uiText("AppStrings.MarkAsRead")} </Button>
        </Hstack>

        {replyOpen && (
          <Vstack className="w-full" align="start">
            <Editor
              content={content}
              setContent={setContent}
              format="markdown"
            />
            <Hstack>
              <Button
                onClick={async () => {
                  if (!content) {
                    addToast({ title: uiText("AppStrings.PleaseEnterValidContent") });
                    return;
                  }
                  if (!hasCookie("token")) {
                    addToast({ title: uiText("CreateGame.NotLogged") });
                    return;
                  }
                  try {
                    setPosting(true);
                    const res = await postComment(content, null, c.id);
                    setPosting(false);

                    if (res.ok) {
                      addToast({ title: uiText("AppStrings.ReplyPosted") });
                      setReplyOpen(false);
                      setContent("");
                      onMarkRead(notification.id);
                    } else {
                      addToast({ title: uiText("AppStrings.FailedToPostReply") });
                    }
                  } catch (e) {
                    setPosting(false);
                    addToast({ title: uiText("AppStrings.AnErrorOccurred") });
                    console.error(e);
                  }
                }}
              >
                {posting ? <Spinner /> : uiText("AppStrings.PostReply")}
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
