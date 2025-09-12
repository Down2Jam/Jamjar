"use client";

import { Card } from "@/framework/Card";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";
import Icon from "@/framework/Icon";
import { NotificationType as AppNotification } from "@/types/NotificationType";
import { formatDistance } from "date-fns";

type Props = {
  notification: AppNotification;
  onMarkRead: (id: number) => Promise<void> | void;
};

export default function GeneralNotification({
  notification,
  onMarkRead,
}: Props) {
  return (
    <Card className="min-w-96">
      <Vstack align="start">
        <Vstack align="start" gap={0}>
          <Hstack>
            <Icon name="bell" color="text" size={16} />
            <Text size="lg">Notification</Text>
          </Hstack>
        </Vstack>

        {notification.body && (
          <Text color="textFaded" size="sm">
            {notification.body}
          </Text>
        )}

        <Hstack className="py-2">
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
