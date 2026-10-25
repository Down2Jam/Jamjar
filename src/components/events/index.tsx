"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  Hstack,
  Text,
  Vstack,
} from "bioloom-ui";
import type { IconName } from "bioloom-ui";
import { CalendarDays, Clock3 } from "lucide-react";
import PageCard from "@/components/PageCard";
import MusicTabs from "@/app/(main)/music/MusicTabs";

const FILTERS: Record<
  EventFilter,
  { name: string; icon: IconName; description: string }
> = {
  current: {
    name: "AppStrings.HappeningNow",
    icon: "treedeciduous",
    description: "AppStrings.EventsCurrentlyInProgress",
  },
  upcoming: {
    name: "AppStrings.Upcoming",
    icon: "clock",
    description: "AppStrings.EventsComingUpNext",
  },
  past: {
    name: "AppStrings.Past",
    icon: "hourglass",
    description: "AppStrings.EventsThatHaveWrappedUp",
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
  const uiText = useUiTranslations();
  return (
<article className="overflow-hidden border-b border-[color-mix(in_srgb,var(--editor-text)_9%,transparent)] last:border-b-0">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <Badge
          content={getIcon(event.icon, 15)}
          size={20}
          className="min-h-10 min-w-10 self-start sm:self-auto"
        >
          <Avatar
            src={event.host?.profilePicture ?? undefined}
            alt={event.host?.name ?? uiText("AppStrings.EventHost")}
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
             {uiText("AppStrings.HostedBy")}{" "}
            <Link
              href={`/u/${event.host?.slug}`}
              className="font-medium underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current"
            >
              {event.host?.name ?? uiText("AppStrings.Unknown")}
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
               {uiText("AppStrings.ViewEvent")} </Button>
            {event.link && (
              <Button
                href={event.link}
                size="sm"
                variant="ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                 {uiText("AppStrings.EventLink")} </Button>
            )}
          </Hstack>
        </Vstack>
      </div>
    </article>
  );
}

function EventSkeleton() {
  return (
    <div className="overflow-hidden">
      <div className="flex animate-pulse items-center gap-4 p-5">
        <div className="h-11 w-11 shrink-0 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/5 rounded-full bg-white/10" />
          <div className="h-3 w-1/4 rounded-full bg-white/5" />
          <div className="h-3 w-3/5 rounded-full bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const uiText = useUiTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
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
    title: uiText("Navbar.Events.Title"),
    description: uiText("AppStrings.FindCurrentAndUpcomingDown2JamCommunityEvents"),
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
    <PageCard icon={CalendarDays} title={uiText("Navbar.Events.Title")} description={uiText("AppStrings.CommunityStreamsTournamentsShowcasesAndGetTogethers")} hasTabs>
      <div className="flex min-w-0 flex-col gap-5 [&_.music-responsive-tab-group]:max-w-full" style={{ "--music-text": colors.text, "--music-muted": colors.textFaded, "--music-accent": colors.blue } as CSSProperties}>
        <MusicTabs ariaLabel={uiText("AppStrings.EventFilters")} groups={[{
          label: uiText("AppStrings.EventFilters"),
          selected: filter,
          onSelect: value => selectFilter(value as EventFilter),
          choices: FILTER_ORDER.map(key => ({ id: key, name: uiText(FILTERS[key].name), description: uiText(FILTERS[key].description), icon: FILTERS[key].icon, inline: true })),
        }]} />
        {canCreateEvent && <div className="flex justify-start">
          <Button icon="calendarplus" color="blue" href="/create-event">{uiText("AppStrings.CreateEvent2")}</Button>
        </div>}

      <div className="flex items-center justify-between gap-3">
        <Vstack align="start" gap={0}>
          <Text size="lg" weight="semibold" color="text">
            {uiText(FILTERS[filter].name)}
          </Text>
          <Text size="sm" color="textFaded">
            {uiText(FILTERS[filter].description)}
          </Text>
        </Vstack>
        {!loading && !isError && (
          <Text size="sm" color="textFaded">
            {visibleEvents.length} {visibleEvents.length === 1 ? uiText("AppStrings.Event2") : uiText("AppStrings.Events2")}
          </Text>
        )}
      </div>

      <Vstack align="stretch" gap={3} aria-live="polite">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <EventSkeleton key={index} />)
        ) : isError ? (
          <div>
            <Vstack gap={2} className="py-7 text-center">
              <Text size="lg" weight="semibold">{uiText("AppStrings.EventsCouldNotBeLoaded")}</Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.SomethingWentWrongWhileFetchingTheSchedulePleaseTryAgain")} </Text>
              <Button size="sm" onClick={() => window.location.reload()}>
                 {uiText("AppStrings.TryAgain")} </Button>
            </Vstack>
          </div>
        ) : visibleEvents.length === 0 ? (
          <div>
            <Vstack gap={2} className="py-8 text-center">
              <CalendarDays size={30} style={{ color: colors["textFaded"] }} />
              <Text size="lg" weight="semibold">{filter === "current" ? uiText("AppStrings.NoEventsHappeningNow") : <>{uiText("AppStrings.No")} {uiText(FILTERS[filter].name).toLowerCase()} {uiText("AppStrings.Events2")}</>}</Text>
              <Text size="sm" color="textFaded">
                {filter === "current"
                  ? uiText("AppStrings.NothingIsLiveRightNowCheckWhatSComingUpNext")
                  : filter === "upcoming"
                    ? uiText("AppStrings.ThereArenTAnyCommunityEventsOnTheCalendarYet")
                    : uiText("AppStrings.ThereAreNoCompletedEventsToShow")}
              </Text>
              {filter === "current" && (
                <Button size="sm" color="blue" onClick={() => selectFilter("upcoming")}>
                   {uiText("AppStrings.ViewUpcomingEvents")} </Button>
              )}
            </Vstack>
          </div>
        ) : (
          visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} filter={filter} />
          ))
        )}
      </Vstack>
      </div>
    </PageCard>
  );
}
