"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Card } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { NotificationType as AppNotification } from "@/types/NotificationType";
import { formatDistance } from "date-fns";
import Link from "@/compat/next-link";
import { getNotificationLink } from "@/helpers/notificationLink";

type Props = {
  notification: AppNotification;
  onMarkRead: (id: number) => Promise<void> | void;
};

const leaderboardBands: Partial<Record<AppNotification["type"], string>> = {
  LEADERBOARD_TOP_SPOT_LOST: "top spot",
  LEADERBOARD_TOP_THREE_LOST: "top 3",
  LEADERBOARD_TOP_FIVE_LOST: "top 5",
};

export default function GeneralNotification({
  notification,
  onMarkRead,
}: Props) {
  const uiText = useUiTranslations();
  const viewLink = getNotificationLink(notification);
  const leaderboardBand = leaderboardBands[notification.type];
  const leaderboardName = typeof notification.data?.leaderboardName === "string"
    ? notification.data.leaderboardName
    : null;
  const gameName = typeof notification.data?.gameName === "string"
    ? notification.data.gameName
    : null;
  const showLinkedGameBody = Boolean(
    leaderboardBand && leaderboardName && gameName && viewLink,
  );

  return (
    <Card className="min-w-96">
      <Vstack align="start">
        <Vstack align="start" gap={0}>
          <Hstack>
            <Icon name="bell" color="text" size={16} />
            <Text size="lg">{notification.title || uiText("AppStrings.Notification")}</Text>
          </Hstack>
        </Vstack>

        {showLinkedGameBody ? (
          <Text color="textFaded" size="sm">
            Your score on{" "}
            <Link
              href={viewLink!}
              className="font-medium underline underline-offset-2"
              onClick={() => {
                void onMarkRead(notification.id);
              }}
            >
              {gameName}
            </Link>
            &apos;s {leaderboardName} leaderboard was knocked out of the {leaderboardBand}.
          </Text>
        ) : notification.body && (
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
                 {uiText("AppStrings.View")} </Button>
            </Link>
          )}
          <Button
            color="blue"
            icon="check"
            onClick={() => onMarkRead(notification.id)}
          >
             {uiText("AppStrings.MarkAsRead2")} </Button>
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
