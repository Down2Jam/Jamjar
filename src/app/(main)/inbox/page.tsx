"use client";

import { Card } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { handleApplication, handleInvite } from "@/helpers/team";
import TeamInviteNotification from "./TeamInviteNotification";
import { deleteNotification } from "@/helpers/notifications";
import TeamApplicationNotification from "./TeamApplicationNotification";
import GeneralNotification from "./GeneralNotification";
import CommentNotification from "./CommentNotification";
import { useSelf } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/queryKeys";

export default function InboxPage() {
  const { data: user } = useSelf();
  const queryClient = useQueryClient();

  const notifications = user?.receivedNotifications ?? [];

  const removeNotificationFromState = async (id: number) => {
    // Invalidate user query to refetch notifications
    await queryClient.invalidateQueries({ queryKey: queryKeys.user.self() });
  };

  return (
    <Vstack>
      <Card>
        <Vstack>
          <Hstack>
            <Icon name="inbox" color="text" />
            <Text size="xl" color="text" weight="semibold">
              Notifications
            </Text>
          </Hstack>
          <Text size="sm" color="textFaded">
            Alerts of things happening on the site
          </Text>
        </Vstack>
      </Card>

      {notifications.map((notification) => {
        const handleMarkRead = async (id: number) => {
          const res = await deleteNotification(id);
          if (res.ok) await removeNotificationFromState(id);
        };

        switch (notification.type) {
          case "TEAM_INVITE":
            return (
              <TeamInviteNotification
                key={notification.id}
                notification={notification}
                onAccept={async (inviteId, notificationId) => {
                  try {
                    const ok = await handleInvite(inviteId, true);
                    if (ok) await handleMarkRead(notificationId);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                onReject={async (inviteId, notificationId) => {
                  try {
                    const ok = await handleInvite(inviteId, false);
                    if (ok) await handleMarkRead(notificationId);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
            );

          case "TEAM_APPLICATION":
            return (
              <TeamApplicationNotification
                key={notification.id}
                notification={notification}
                onAccept={async (applicationId, notificationId) => {
                  try {
                    const ok = await handleApplication(applicationId, true);
                    if (ok) await handleMarkRead(notificationId);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                onReject={async (applicationId, notificationId) => {
                  try {
                    const ok = await handleApplication(applicationId, false);
                    if (ok) await handleMarkRead(notificationId);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
            );

          case "GAME_COMMENT":
          case "TRACK_COMMENT":
          case "POST_COMMENT":
          case "COMMENT_REPLY":
            return (
              <CommentNotification
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            );

          default:
            return (
              <GeneralNotification
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            );
        }
      })}
    </Vstack>
  );
}
