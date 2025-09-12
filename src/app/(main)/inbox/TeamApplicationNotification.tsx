"use client";

import { Card } from "@/framework/Card";
import { Vstack, Hstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";
import Icon from "@/framework/Icon";
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
            <Text size="lg">Team Application</Text>
          </Hstack>
          <Text size="xs" color="textFaded">
            {application.user.name} applied to join your team
          </Text>
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
            Accept
          </Button>
          <Button
            onClick={() => onReject(application.id, notification.id)}
            icon="x"
            color="red"
          >
            Reject
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
