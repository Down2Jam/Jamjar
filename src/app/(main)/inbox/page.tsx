"use client";

import { Card } from "@/framework/Card";
import Icon from "@/framework/Icon";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { handleApplication, handleInvite } from "@/helpers/team";
import { getSelf } from "@/requests/user";
import { UserType } from "@/types/UserType";
import { useEffect, useState } from "react";
import TeamInviteNotification from "./TeamInviteNotification";
import { deleteNotification } from "@/helpers/notifications";
import TeamApplicationNotification from "./TeamApplicationNotification";
import GeneralNotification from "./GeneralNotification";
import CommentNotification from "./CommentNotification";

export default function InboxPage() {
  const [user, setUser] = useState<UserType>();

  useEffect(() => {
    (async () => {
      try {
        const self = await getSelf();
        const data = await self.json();
        setUser(data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const notifications = user?.receivedNotifications ?? [];

  const removeNotificationFromState = (id: number) =>
    setUser((prev) =>
      prev
        ? {
            ...prev,
            receivedNotifications: prev.receivedNotifications.filter(
              (n) => n.id !== id
            ),
          }
        : prev
    );

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
          if (res.ok) removeNotificationFromState(id);
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
