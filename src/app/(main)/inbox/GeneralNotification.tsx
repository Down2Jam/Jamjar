"use client";

import { Card } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { NotificationType as AppNotification } from "@/types/NotificationType";
import { formatDistance } from "date-fns";
import Link from "@/compat/next-link";

type Props = {
  notification: AppNotification;
  onMarkRead: (id: number) => Promise<void> | void;
};

export default function GeneralNotification({
  notification,
  onMarkRead,
}: Props) {
  const viewLink = getNotificationLink(notification);

  return (
    <Card className="min-w-96">
      <Vstack align="start">
        <Vstack align="start" gap={0}>
          <Hstack>
            <Icon name="bell" color="text" size={16} />
            <Text size="lg">{notification.title || "Notification"}</Text>
          </Hstack>
        </Vstack>

        {notification.body && (
          <Text color="textFaded" size="sm">
            {notification.body}
          </Text>
        )}

        <Hstack className="py-2">
          {viewLink && (
            <Link
              href={viewLink}
              onClick={() => {
                void onMarkRead(notification.id);
              }}
            >
              <Button color="default" icon="arrowright">
                View
              </Button>
            </Link>
          )}
          <Button
            color="blue"
            icon="check"
            onClick={() => onMarkRead(notification.id)}
          >
            Mark as Read
          </Button>
        </Hstack>

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

function getNotificationLink(notification: AppNotification) {
  if (notification.type === "FOLLOW") {
    const userSlug =
      typeof notification.data?.userSlug === "string"
        ? notification.data.userSlug
        : null;
    if (userSlug) return `/u/${userSlug}`;
  }

  if (!notification.link) return null;
  const legacyUserMatch = notification.link.match(/^\/users\/([^/?#]+)(.*)$/);
  if (legacyUserMatch) {
    return `/u/${legacyUserMatch[1]}${legacyUserMatch[2] ?? ""}`;
  }
  return notification.link;
}
