"use client";

import { useEffect, useState } from "react";
import { addToast, Button, Hstack, Spinner, Switch, Text, Vstack } from "bioloom-ui";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/requests/notification";
import type { NotificationKind } from "@/types/NotificationType";

type NotificationPreferenceResponse = {
  mutedTypes?: NotificationKind[];
  enabledTypes?: NotificationKind[];
  emailEnabled?: boolean;
};

const NOTIFICATION_GROUPS: Array<{
  title: string;
  description: string;
  types: NotificationKind[];
}> = [
  {
    title: "Settings.Notifications.General.Title",
    description: "Settings.Notifications.General.Description",
    types: ["GENERAL"],
  },
  {
    title: "Settings.Notifications.RatingReminders.Title",
    description: "Settings.Notifications.RatingReminders.Description",
    types: ["RATING_REMINDER"],
  },
  {
    title: "Settings.Notifications.Comments.Title",
    description: "Settings.Notifications.Comments.Description",
    types: ["GAME_COMMENT", "TRACK_COMMENT", "POST_COMMENT", "COMMENT_REPLY"],
  },
  {
    title: "Settings.Notifications.Follows.Title",
    description: "Settings.Notifications.Follows.Description",
    types: ["FOLLOW", "FOLLOW_BACK"],
  },
  {
    title: "Settings.Notifications.Teams.Title",
    description: "Settings.Notifications.Teams.Description",
    types: ["TEAM_INVITE", "TEAM_APPLICATION"],
  },
  {
    title: "Settings.Notifications.LeaderboardTopSpot.Title",
    description: "Settings.Notifications.LeaderboardTopSpot.Description",
    types: ["LEADERBOARD_TOP_SPOT_LOST"],
  },
  {
    title: "Settings.Notifications.LeaderboardTopThree.Title",
    description: "Settings.Notifications.LeaderboardTopThree.Description",
    types: ["LEADERBOARD_TOP_THREE_LOST"],
  },
  {
    title: "Settings.Notifications.LeaderboardTopFive.Title",
    description: "Settings.Notifications.LeaderboardTopFive.Description",
    types: ["LEADERBOARD_TOP_FIVE_LOST"],
  },
];

export default function NotificationSettingsSection() {
  const uiText = useUiTranslations();
  const [mutedTypes, setMutedTypes] = useState<Set<NotificationKind>>(new Set());
  const [enabledTypes, setEnabledTypes] = useState<Set<NotificationKind>>(new Set());
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await getNotificationPreferences();
        const preferences = (await response.json()) as NotificationPreferenceResponse;

        if (!response.ok) throw new Error("Failed to load notification preferences");

        setMutedTypes(new Set(preferences.mutedTypes ?? []));
        setEnabledTypes(new Set(preferences.enabledTypes ?? []));
        setEmailEnabled(Boolean(preferences.emailEnabled));
      } catch (error) {
        console.error(error);
        addToast({ title: uiText("Settings.Notifications.LoadError") });
      } finally {
        setLoading(false);
      }
    })();
  }, [uiText]);

  const setGroupEnabled = (types: NotificationKind[], enabled: boolean) => {
    setMutedTypes((current) => {
      const next = new Set(current);
      types.forEach((type) => enabled ? next.delete(type) : next.add(type));
      return next;
    });
  };

  const save = async () => {
    setSaving(true);

    try {
      const response = await updateNotificationPreferences({
        mutedTypes: [...mutedTypes],
        enabledTypes: [...enabledTypes],
        emailEnabled,
      });

      if (!response.ok) throw new Error("Failed to save notification preferences");

      addToast({ title: uiText("Settings.Notifications.Saved") });
    } catch (error) {
      console.error(error);
      addToast({ title: uiText("Settings.Notifications.SaveError") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      {NOTIFICATION_GROUPS.map((group) => (
        <div className="game-editor-row" key={group.title}>
          <Hstack align="start" className="w-full gap-3">
            <Switch
              checked={group.types.every((type) => !mutedTypes.has(type))}
              onChange={(enabled) => setGroupEnabled(group.types, enabled)}
              className="mt-1 shrink-0"
            />
            <Vstack align="start" gap={0} className="min-w-0 flex-1">
              <Text color="text">{uiText(group.title)}</Text>
              <Text color="textFaded" size="xs">{uiText(group.description)}</Text>
            </Vstack>
          </Hstack>
        </div>
      ))}

      <div className="game-editor-row">
        <Hstack align="start" className="w-full gap-3">
          <Switch
            checked={enabledTypes.has("STREAM_LIVE")}
            onChange={(enabled) => {
              setEnabledTypes((current) => {
                const next = new Set(current);
                enabled ? next.add("STREAM_LIVE") : next.delete("STREAM_LIVE");
                return next;
              });
            }}
            className="mt-1 shrink-0"
          />
          <Vstack align="start" gap={0} className="min-w-0 flex-1">
            <Text color="text">{uiText("Settings.Notifications.StreamLive.Title")}</Text>
            <Text color="textFaded" size="xs">
              {uiText("Settings.Notifications.StreamLive.Description")}
            </Text>
          </Vstack>
        </Hstack>
      </div>

      <div className="game-editor-row">
        <Button type="button" color="blue" icon="save" loading={saving} onClick={save}>
          {uiText("Settings.Save.Title")}
        </Button>
      </div>
    </>
  );
}
