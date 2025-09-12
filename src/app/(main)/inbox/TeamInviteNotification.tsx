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
  onAccept: (inviteId: number, notificationId: number) => Promise<void> | void;
  onReject: (inviteId: number, notificationId: number) => Promise<void> | void;
};

export default function TeamInviteNotification({
  notification,
  onAccept,
  onReject,
}: Props) {
  const invite = notification.teamInvite;

  if (!invite) {
    return <></>;
  }

  return (
    <Card className="min-w-96">
      <Vstack align="start">
        <Vstack align="start" gap={0}>
          <Hstack>
            <Icon name="users" color="text" size={16} />
            <Text size="lg">Team Invite</Text>
          </Hstack>
          <Text size="xs" color="textFaded">
            You&apos;ve been invited to{" "}
            {invite.team.name || `${invite.team.owner.name}&apos;s Team`}
          </Text>
        </Vstack>

        {invite.content && (
          <Text size="sm" color="textFaded">
            {invite.content}
          </Text>
        )}

        <Hstack>
          <Button
            onClick={() => onAccept(invite.id, notification.id)}
            icon="check"
            color="green"
          >
            Accept
          </Button>
          <Button
            onClick={() => onReject(invite.id, notification.id)}
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
