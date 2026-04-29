"use client";

import { useEffect, useMemo, useState } from "react";
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
                Admin Dashboard
              </Text>
              <Text size="sm" color="textFaded">
                Keep jams, events, results, and theme rounds organized in one
                place.
              </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="blue" href="/admin/jams" icon="calendar">
                Manage Jams
              </Button>
              <Button color="green" href="/admin/events" icon="calendarplus">
                Manage Events
              </Button>
              <Button color="yellow" href="/admin/results" icon="trophy">
                Results Preview
              </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card>
          <Vstack align="stretch" gap={3}>
            <Text size="lg" weight="semibold">
              Live Overview
            </Text>
            {loading ? (
              <Spinner />
            ) : (
              <Vstack align="stretch" gap={2}>
                <Vstack gap={0} align="stretch">
                  <Text size="sm" color="textFaded">
                    Active Jam
                  </Text>
                  <Text size="lg" weight="semibold">
                    {activeJam?.jam?.name || latestJam?.name || "No active jam"}
                  </Text>
                  <Text size="xs" color="textFaded">
                    {activeJam?.phase || "Phase not available"}
                  </Text>
                </Vstack>
                <Vstack gap={0} align="stretch">
                  <Text size="sm" color="textFaded">
                    Upcoming Event
                  </Text>
                  <Text size="lg" weight="semibold">
                    {nextEvent?.name || "No upcoming events"}
                  </Text>
                  <Text size="xs" color="textFaded">
                    {nextEvent
                      ? formatEventTime(nextEvent.startTime)
                      : "Create the next schedule block."}
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
              <Text size="lg" weight="semibold">
                Events
              </Text>
              <Text size="sm" color="textFaded">
                Build the schedule and keep streams in sync.
              </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="blue" href="/create-event" icon="calendarplus">
                Create Event
              </Button>
              <Button href="/admin/events" icon="calendar">
                Manage Events
              </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                Jams
              </Text>
              <Text size="sm" color="textFaded">
                Review jam timelines and phase durations.
              </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="green" href="/admin/jams" icon="calendarcog">
                Jam Overview
              </Button>
              <Button href="/about" icon="info">
                Public Jam Page
              </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                Game Results
              </Text>
              <Text size="sm" color="textFaded">
                Preview leaderboards before publishing them.
              </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="yellow" href="/admin/results" icon="trophy">
                Results Preview
              </Button>
              <Button href="/results" icon="arrowupright">
                Public Results
              </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                Theme Suggestions
              </Text>
              <Text size="sm" color="textFaded">
                Review ideas coming in for the next jam.
              </Text>
            </Vstack>
            <Hstack wrap>
              <Button
                color="blue"
                href="/admin/themes/suggestions"
                icon="sparkles"
              >
                Suggestion Results
              </Button>
              <Button href="/theme-suggestions" icon="arrowupright">
                Suggestion Page
              </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                Theme Elimination
              </Text>
              <Text size="sm" color="textFaded">
                Track elimination scores and shortlists.
              </Text>
            </Vstack>
            <Hstack wrap>
              <Button
                color="green"
                href="/admin/themes/elimination"
                icon="swords"
              >
                Elimination Results
              </Button>
              <Button href="/theme-elimination" icon="arrowupright">
                Elimination Page
              </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                Theme Voting
              </Text>
              <Text size="sm" color="textFaded">
                Monitor the voting round and its shortlist.
              </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="yellow" href="/admin/themes/voting" icon="vote">
                Voting Results
              </Button>
              <Button href="/theme-voting" icon="arrowupright">
                Voting Page
              </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                Emoji Library
              </Text>
              <Text size="sm" color="textFaded">
                Add custom emoji for posts, comments, and reactions.
              </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="blue" href="/admin/emojis" icon="sparkles">
                Manage Emojis
              </Button>
            </Hstack>
          </Vstack>
        </Card>

        <Card className="h-full">
          <Vstack align="stretch">
            <Vstack gap={1} align="stretch">
              <Text size="lg" weight="semibold">
                Image Library
              </Text>
              <Text size="sm" color="textFaded">
                Track uploaded images and unused files.
              </Text>
            </Vstack>
            <Hstack wrap>
              <Button color="blue" href="/admin/images" icon="images">
                View Images
              </Button>
            </Hstack>
          </Vstack>
        </Card>
      </section>
    </main>
  );
}
