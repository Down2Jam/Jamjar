"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Card } from "bioloom-ui";
import { Vstack, Hstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { NotificationType } from "@/types/NotificationType";
import { formatDistance } from "date-fns";

type Props = {
  notification: NotificationType;
  onAccept: (
    applicationId: number,
    notificationId: number
  ) => Promise<void> | void;
  onReject: (
    applicationId: number,
    notificationId: number
  ) => Promise<void> | void;
};

export default function TeamApplicationNotification({
  notification,
  onAccept,
  onReject,
}: Props) {
  const uiText = useUiTranslations();
  const application = notification.teamApplication;

  if (!application) {
    return <></>;
  }

  return (
    <Card className="min-w-96">
      <Vstack align="start">
        <Vstack align="start" gap={0}>
          <Hstack>
            <Icon name="userplus" color="text" size={16} />
            <Text size="lg">{uiText("AppStrings.TeamApplication")}</Text>
          </Hstack>
          <Text size="xs" color="textFaded">
            {application.user.name}  {uiText("AppStrings.AppliedToJoinYourTeam")} </Text>
        </Vstack>

        {application.content && (
          <Text size="sm" color="textFaded">
            {application.content}
          </Text>
        )}

        <Hstack>
          <Button
            onClick={() => onAccept(application.id, notification.id)}
            icon="check"
            color="green"
          >
             {uiText("AppStrings.Accept")} </Button>
          <Button
            onClick={() => onReject(application.id, notification.id)}
            icon="x"
            color="red"
          >
             {uiText("AppStrings.Reject")} </Button>
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
