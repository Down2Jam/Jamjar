"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useEffect, useMemo, useState } from "react";
import { useSelf } from "@/hooks/queries";
import { useTranslations } from "@/compat/next-intl";
import { getCurrentJam, getJams } from "@/helpers/jam";
import type { ActiveJamResponse } from "@/helpers/jam";
import { getEvents } from "@/requests/event";
import type { EventType } from "@/types/EventType";
import type { JamType } from "@/types/JamType";
import { useTheme } from "@/providers/useSiteTheme";
import { Button, Card, Hstack, Spinner, Text, Vstack } from "bioloom-ui";

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatEventTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return dateTimeFormat.format(date);
}

export default function AdminDashboard() {
  const uiText = useUiTranslations();
  const { data: user } = useSelf();
  const t = useTranslations();
  const [activeJam, setActiveJam] = useState<ActiveJamResponse | null>(null);
  const [jams, setJams] = useState<JamType[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setLoading(true);
      try {
        const [eventsResponse, jamList, currentJam] = await Promise.all([
          getEvents("upcoming"),
          getJams(),
          getCurrentJam(),
        ]);

        if (!active) return;

        if (eventsResponse.ok) {
          const data = await eventsResponse.json();
          setEvents(data.data ?? []);
        } else {
          setEvents([]);
        }

        const sorted = [...jamList].sort((a, b) => {
          const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
          const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
          return bTime - aTime;
        });
        setJams(sorted);
        setActiveJam(currentJam ?? null);
      } catch (error) {
        console.error("Failed to load admin overview", error);
        if (!active) return;
        setEvents([]);
        setJams([]);
        setActiveJam(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  const nextEvent = events[0];
  const latestJam = jams[0];

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="relative overflow-hidden" glass>
          <Vstack align="stretch" gap={3}>
            <Vstack gap={1} align="stretch">
              <Text size="3xl" weight="bold">
                 {uiText("AppStrings.AdminDashboard")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.KeepJamsEventsResultsAndThemeRoundsOrganized")} </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="blue" href="/admin/jams" icon="calendar">
                 {uiText("AppStrings.ManageJams")} </Button>
              <Button color="green" href="/admin/events" icon="calendarplus">
                 {uiText("AppStrings.ManageEvents")} </Button>
              <Button color="yellow" href="/admin/results" icon="trophy">
                 {uiText("AppStrings.ResultsPreview")} </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card>
          <Vstack align="stretch" gap={3}>
            <Text size="lg" weight="semibold">
               {uiText("AppStrings.LiveOverview")} </Text>
            {loading ? (
              <Spinner />
            ) : (
              <Vstack align="stretch" gap={2}>
                <Vstack gap={0} align="stretch">
                  <Text size="sm" color="textFaded">
                     {uiText("AppStrings.ActiveJam2")} </Text>
                  <Text size="lg" weight="semibold">
                    {activeJam?.jam?.name || latestJam?.name || uiText("AppStrings.NoActiveJam")}
                  </Text>
                  <Text size="xs" color="textFaded">
                    {activeJam?.phase || uiText("AppStrings.PhaseNotAvailable")}
                  </Text>
                </Vstack>
                <Vstack gap={0} align="stretch">
                  <Text size="sm" color="textFaded">
                     {uiText("AppStrings.UpcomingEvent")} </Text>
                  <Text size="lg" weight="semibold">
                    {nextEvent?.name || uiText("AppStrings.NoUpcomingEvents")}
                  </Text>
                  <Text size="xs" color="textFaded">
                    {nextEvent
                      ? formatEventTime(nextEvent.startTime)
                      : uiText("AppStrings.CreateTheNextScheduleBlock")}
                  </Text>
                </Vstack>
              </Vstack>
            )}
          </Vstack>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">{uiText("AppStrings.BugReports")}</Text>
              <Text size="sm" color="textFaded">{uiText("AppStrings.ReviewIssuesTrackProgressAndRecordFixes")}</Text>
            </Vstack>
            <Hstack wrap>
              <Button color="blue" href="/admin/bugs" icon="bug">{uiText("AppStrings.BugReports")}</Button>
            </Hstack>
          </Vstack>
        </Card>

        {user?.admin && user.slug === "ategon" && (
          <Card className="h-full">
            <Vstack align="stretch">
              <Vstack gap={1} align="stretch">
                <Text size="lg" weight="semibold">{t("AdminJamGames.Title")}</Text>
                <Text size="sm" color="textFaded">{t("AdminJamGames.Description")}</Text>
              </Vstack>
              <Hstack wrap>
                <Button color="green" href="/admin/jam-games" icon="gamepad2">{t("AdminJamGames.Title")}</Button>
              </Hstack>
            </Vstack>
          </Card>
        )}

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                 {uiText("Navbar.Events.Title")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.BuildTheScheduleAndKeepStreamsInSync")} </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="blue" href="/create-event" icon="calendarplus">
                 {uiText("AppStrings.CreateEvent")} </Button>
              <Button href="/admin/events" icon="calendar">
                 {uiText("AppStrings.ManageEvents")} </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                 {uiText("AppStrings.Jams")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.ReviewJamTimelinesAndPhaseDurations")} </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="green" href="/admin/jams" icon="calendarcog">
                 {uiText("AppStrings.JamOverview")} </Button>
              <Button href="/about" icon="info">
                 {uiText("AppStrings.PublicJamPage")} </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                 {uiText("AppStrings.GameResults")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.PreviewLeaderboardsBeforePublishingThem")} </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="yellow" href="/admin/results" icon="trophy">
                 {uiText("AppStrings.ResultsPreview")} </Button>
              <Button href="/results" icon="arrowupright">
                 {uiText("AppStrings.PublicResults")} </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                 {uiText("Navbar.ThemeSuggestions.Title")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.ReviewIdeasComingInForTheNextJam")} </Text>
            </Vstack>
            <Hstack wrap>
              <Button
                color="blue"
                href="/admin/themes/suggestions"
                icon="sparkles"
              >
                 {uiText("AppStrings.SuggestionResults")} </Button>
              <Button href="/theme-suggestions" icon="arrowupright">
                 {uiText("AppStrings.SuggestionPage")} </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                 {uiText("Navbar.ThemeElimination.Title")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.TrackEliminationScoresAndShortlists")} </Text>
            </Vstack>
            <Hstack wrap>
              <Button
                color="green"
                href="/admin/themes/elimination"
                icon="swords"
              >
                 {uiText("AppStrings.EliminationResults")} </Button>
              <Button href="/theme-elimination" icon="arrowupright">
                 {uiText("AppStrings.EliminationPage")} </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                 {uiText("Navbar.ThemeVoting.Title")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.MonitorTheVotingRoundAndItsShortlist")} </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="yellow" href="/admin/themes/voting" icon="vote">
                 {uiText("AppStrings.VotingResults")} </Button>
              <Button href="/theme-voting" icon="arrowupright">
                 {uiText("AppStrings.VotingPage")} </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                 {uiText("AppStrings.EmojiLibrary")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.AddCustomEmojiForPostsCommentsAndReactions")} </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="blue" href="/admin/emojis" icon="sparkles">
                 {uiText("AppStrings.ManageEmojis")} </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                 {uiText("AppStrings.ImageLibrary")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.TrackUploadedImagesAndUnusedFiles")} </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="blue" href="/admin/images" icon="images">
                 {uiText("AppStrings.ViewImages")} </Button>
            </Hstack>
          </Vstack>
        </Card>
      </section>
    </main>
  );
}
