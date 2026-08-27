"use client";

import { Button, Hstack, Text, Vstack } from "bioloom-ui";
import { useQueryClient } from "@tanstack/react-query";

import { useSelf } from "@/hooks/queries";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { deleteNotification } from "@/helpers/notifications";
import { handleApplication, handleInvite } from "@/helpers/team";
import { markAllNotificationsRead, updateNotification } from "@/requests/notification";
import CommentNotification from "./CommentNotification";
import GeneralNotification from "./GeneralNotification";
import TeamApplicationNotification from "./TeamApplicationNotification";
import TeamInviteNotification from "./TeamInviteNotification";

export default function NotificationsView() {
  const { data: user } = useSelf();
  const queryClient = useQueryClient();
  const notifications = user?.receivedNotifications ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.user.self() });

  return (
    <Vstack align="stretch" className="gap-3">
      <Hstack justify="between" className="flex-wrap gap-2">
        <Text size="sm" color="textFaded">Alerts about activity across the site.</Text>
        <Hstack>
          <Button size="sm" icon="check" onClick={async () => {
            if ((await markAllNotificationsRead()).ok) await refresh();
          }}>Mark all read</Button>
          <Button size="sm" icon="rotateccw" onClick={refresh}>Refresh</Button>
        </Hstack>
      </Hstack>
      {!notifications.length && <div className="py-16 text-center"><Text color="textFaded">No notifications.</Text></div>}
      {notifications.map((notification) => {
        const markRead = async (id: number) => {
          if ((await updateNotification(id, { read: true })).ok) await refresh();
        };
        const archive = async (id: number) => {
          if ((await deleteNotification(id)).ok) await refresh();
        };
        if (notification.type === "TEAM_INVITE") {
          return <TeamInviteNotification key={notification.id} notification={notification}
            onAccept={async (inviteId, notificationId) => {
              if (await handleInvite(inviteId, true)) await archive(notificationId);
            }}
            onReject={async (inviteId, notificationId) => {
              if (await handleInvite(inviteId, false)) await archive(notificationId);
            }} />;
        }
        if (notification.type === "TEAM_APPLICATION") {
          return <TeamApplicationNotification key={notification.id} notification={notification}
            onAccept={async (applicationId, notificationId) => {
              if (await handleApplication(applicationId, true)) await archive(notificationId);
            }}
            onReject={async (applicationId, notificationId) => {
              if (await handleApplication(applicationId, false)) await archive(notificationId);
            }} />;
        }
        if (["GAME_COMMENT", "TRACK_COMMENT", "POST_COMMENT", "COMMENT_REPLY"].includes(notification.type)) {
          return <CommentNotification key={notification.id} notification={notification} onMarkRead={markRead} />;
        }
        return <GeneralNotification key={notification.id} notification={notification} onMarkRead={markRead} />;
      })}
    </Vstack>
  );
}
