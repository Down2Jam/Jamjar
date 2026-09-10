"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/compat/next-link";
import { useRouter, useSearchParams } from "@/compat/next-navigation";
import { hasCookie } from "@/helpers/cookie";
import { getIcon } from "@/helpers/icon";
import { navigateToSearchIfChanged } from "@/helpers/navigation";
import { useEvents, useSelf } from "@/hooks/queries";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { useTheme } from "@/providers/useSiteTheme";
import type { EventFilter } from "@/types/EventFilter";
import type { EventType } from "@/types/EventType";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Hstack,
  Text,
  Vstack,
} from "bioloom-ui";
import type { IconName } from "bioloom-ui";
import { CalendarDays, Clock3 } from "lucide-react";

const FILTERS: Record<
  EventFilter,
  { name: string; icon: IconName; description: string }
> = {
  current: {
    name: "Happening now",
    icon: "treedeciduous",
    description: "Events currently in progress",
  },
  upcoming: {
    name: "Upcoming",
    icon: "clock",
    description: "Events coming up next",
  },
  past: {
    name: "Past",
    icon: "hourglass",
    description: "Events that have wrapped up",
  },
};

const FILTER_ORDER: EventFilter[] = ["current", "upcoming", "past"];

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatEventWindow(start: Date, end: Date) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Schedule unavailable";
  }

  return `${dateTimeFormat.format(startDate)} – ${dateTimeFormat.format(endDate)}`;
}

function formatDistance(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  if (totalMinutes < 60) return `${totalMinutes}m`;

  const totalHours = Math.ceil(totalMinutes / 60);
  if (totalHours < 48) return `${totalHours}h`;

  return `${Math.ceil(totalHours / 24)}d`;
}

function EventTiming({ event, filter }: { event: EventType; filter: EventFilter }) {
  const [, refresh] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => refresh((value) => value + 1), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const now = Date.now();
  const target = new Date(
    filter === "upcoming" ? event.startTime : event.endTime,
  ).getTime();

  if (Number.isNaN(target)) return null;

  const label =
    filter === "past"
      ? `Ended ${formatDistance(now - target)} ago`
      : filter === "upcoming"
        ? `Starts in ${formatDistance(target - now)}`
        : `Ends in ${formatDistance(target - now)}`;

  return (
    <Hstack gap={1} className="shrink-0">
      <Clock3 size={14} aria-hidden="true" />
      <Text size="xs" color="textFaded">
        {label}
      </Text>
    </Hstack>
  );
}

function EventCard({ event, filter }: { event: EventType; filter: EventFilter }) {
  return (
    <Card
      padding={0}
      radius="lg"
      className="overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <Badge
          content={getIcon(event.icon, 15)}
          size={20}
          className="min-h-10 min-w-10 self-start sm:self-auto"
        >
          <Avatar
            src={event.host?.profilePicture ?? undefined}
            alt={event.host?.name ?? "Event host"}
            size={44}
          />
        </Badge>

        <Vstack align="start" gap={1} className="min-w-0 flex-1">
          <Link href={`/e/${event.slug}`} className="max-w-full">
            <Text
              size="lg"
              weight="semibold"
              color="text"
              className="truncate transition-opacity hover:opacity-75"
            >
              {event.name}
            </Text>
          </Link>
          <Text size="sm" color="textFaded">
            Hosted by{" "}
            <Link
              href={`/u/${event.host?.slug}`}
              className="font-medium underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
            >
              {event.host?.name ?? "Unknown"}
            </Link>
          </Text>
          <Hstack gap={1} className="mt-1 flex-wrap">
            <CalendarDays size={14} aria-hidden="true" />
            <Text size="xs" color="textFaded">
              {formatEventWindow(event.startTime, event.endTime)}
            </Text>
          </Hstack>
        </Vstack>

        <Vstack align="end" gap={2} className="sm:min-w-32">
          <EventTiming event={event} filter={filter} />
          <Hstack className="w-full sm:w-auto">
            <Button href={`/e/${event.slug}`} size="sm" color="blue">
              View event
            </Button>
            {event.link && (
              <Button
                href={event.link}
                size="sm"
                variant="ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                Event link
              </Button>
            )}
          </Hstack>
        </Vstack>
      </div>
    </Card>
  );
}

function EventSkeleton() {
  return (
    <Card padding={0} radius="lg" className="overflow-hidden">
      <div className="flex animate-pulse items-center gap-4 p-5">
        <div className="h-11 w-11 shrink-0 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/5 rounded-full bg-white/10" />
          <div className="h-3 w-1/4 rounded-full bg-white/5" />
          <div className="h-3 w-3/5 rounded-full bg-white/5" />
        </div>
      </div>
    </Card>
  );
}

export default function Events() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { colors, siteTheme } = useTheme();
  const headerColor = colors["text"];
  const initialFilter = searchParams.get("filter") as EventFilter;
  const [filter, setFilter] = useState<EventFilter>(
    FILTER_ORDER.includes(initialFilter) ? initialFilter : "current",
  );

  const hasToken = hasCookie("token");
  const { data: events, isLoading: eventsLoading, isError } = useEvents(filter);
  const { data: user, isLoading: userLoading } = useSelf(hasToken);
  const loading = eventsLoading || (hasToken && userLoading);
  const canCreateEvent = Boolean(user?.twitch || user?.mod);

  usePageMetadata({
    title: "Events",
    description: "Find current and upcoming Down2Jam community events.",
    canonical: "/events",
    image: "/images/D2J_Icon.png",
  });

  const visibleEvents = useMemo(() => events ?? [], [events]);

  const selectFilter = (nextFilter: EventFilter) => {
    setFilter(nextFilter);
    const params = new URLSearchParams(window.location.search);
    if (nextFilter === "current") params.delete("filter");
    else params.set("filter", nextFilter);
    navigateToSearchIfChanged(router, params);
  };

  return (
    <Vstack align="stretch" gap={5}>
      <header className="relative py-2 text-center">
        <h1
          className="text-3xl font-semibold"
          style={{
            color: headerColor,
            textShadow:
              siteTheme.type === "Light"
                ? "none"
                : "0 1px 5px rgba(0, 0, 0, 0.75)",
          }}
        >
          Events
        </h1>
        <p
          className="mt-1 text-sm"
          style={{
            color: headerColor,
            opacity: 0.82,
            textShadow:
              siteTheme.type === "Light"
                ? "none"
                : "0 1px 4px rgba(0, 0, 0, 0.8)",
          }}
        >
          Community streams, tournaments, showcases, and get-togethers.
        </p>
        {canCreateEvent && (
          <div className="mt-3 flex justify-center sm:absolute sm:right-0 sm:top-2 sm:mt-0">
            <Button icon="calendarplus" color="blue" href="/create-event">
              Create event
            </Button>
          </div>
        )}
      </header>

      <div
        className="flex flex-wrap justify-center gap-1 rounded-xl border p-1.5 sm:self-center"
        style={{
          backgroundColor: `color-mix(in srgb, ${colors["mantle"]} 82%, transparent)`,
          borderColor: `color-mix(in srgb, ${colors["text"]} 8%, transparent)`,
        }}
        aria-label="Event filters"
      >
        {FILTER_ORDER.map((key) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "standard" : "ghost"}
            color={filter === key ? "blue" : "default"}
            icon={FILTERS[key].icon}
            onClick={() => selectFilter(key)}
            aria-pressed={filter === key}
          >
            {FILTERS[key].name}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Vstack align="start" gap={0}>
          <Text size="lg" weight="semibold" color="text">
            {FILTERS[filter].name}
          </Text>
          <Text size="sm" color="textFaded">
            {FILTERS[filter].description}
          </Text>
        </Vstack>
        {!loading && !isError && (
          <Text size="sm" color="textFaded">
            {visibleEvents.length} {visibleEvents.length === 1 ? "event" : "events"}
          </Text>
        )}
      </div>

      <Vstack align="stretch" gap={3} aria-live="polite">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <EventSkeleton key={index} />)
        ) : isError ? (
          <Card radius="lg">
            <Vstack gap={2} className="py-7 text-center">
              <Text size="lg" weight="semibold">Events could not be loaded</Text>
              <Text size="sm" color="textFaded">
                Something went wrong while fetching the schedule. Please try again.
              </Text>
              <Button size="sm" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </Vstack>
          </Card>
        ) : visibleEvents.length === 0 ? (
          <Card radius="lg">
            <Vstack gap={2} className="py-8 text-center">
              <CalendarDays size={30} style={{ color: colors["textFaded"] }} />
              <Text size="lg" weight="semibold">No {FILTERS[filter].name.toLowerCase()} events</Text>
              <Text size="sm" color="textFaded">
                {filter === "current"
                  ? "Nothing is live right now. Check what’s coming up next."
                  : filter === "upcoming"
                    ? "There aren’t any community events on the calendar yet."
                    : "There are no completed events to show."}
              </Text>
              {filter === "current" && (
                <Button size="sm" color="blue" onClick={() => selectFilter("upcoming")}>
                  View upcoming events
                </Button>
              )}
            </Vstack>
          </Card>
        ) : (
          visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} filter={filter} />
          ))
        )}
      </Vstack>
    </Vstack>
  );
}
