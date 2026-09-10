"use client";

import MentionedContent from "@/components/mentions/MentionedContent";
import ThemedProse from "@/components/themed-prose";
import { useParams } from "@/compat/next-navigation";
import { getIcon } from "@/helpers/icon";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { useEvent } from "@/hooks/queries";
import { useTheme } from "@/providers/useSiteTheme";
import { Avatar, Button, Card, Spinner, Text, Vstack } from "bioloom-ui";
import { CalendarDays, Clock3, ExternalLink } from "lucide-react";

const eventDateTimeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function eventStatus(startTime: Date, endTime: Date) {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return "Schedule unavailable";
  if (now < start) return "Upcoming";
  if (now >= end) return "Event ended";
  return "Happening now";
}

export default function EventPage() {
  const { slug } = useParams();
  const { data: event, isLoading, isError, refetch } = useEvent(`${slug}`);
  const { colors } = useTheme();

  usePageMetadata({
    title: event?.name ?? "Event",
    description: event?.content
      ? event.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      : "View this Down2Jam community event.",
    canonical: `/e/${slug}`,
    image: "/images/D2J_Icon.png",
  });

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <Card className="mx-auto max-w-xl">
        <Vstack gap={3} className="py-8 text-center">
          <Text size="xl" weight="semibold">Event could not be loaded</Text>
          <Text color="textFaded">The event may no longer exist, or the server could not be reached.</Text>
          <Button onClick={() => void refetch()}>Try again</Button>
        </Vstack>
      </Card>
    );
  }

  const status = eventStatus(event.startTime, event.endTime);
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const statusColor = status === "Happening now" ? colors["green"] : colors["textFaded"];

  return (
    <main className="mx-auto w-full max-w-5xl pb-10">
      <Button href="/events" variant="ghost" size="sm" className="mb-4">
        ← All events
      </Button>

      <Card padding={0} radius="md" className="overflow-hidden">
        <header
          className="border-b px-5 py-6 sm:px-8 sm:py-7"
          style={{
            borderColor: `color-mix(in srgb, ${colors["text"]} 8%, transparent)`,
            backgroundColor: colors["mantle"],
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: statusColor }}>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: statusColor }}
                aria-hidden="true"
              />
              {status}
            </div>
            <div className="mt-3 flex items-center gap-3" style={{ color: colors["blue"] }}>
              <span className="shrink-0" aria-hidden="true">{getIcon(event.icon, 30)}</span>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl" style={{ color: colors["text"] }}>
                {event.name}
              </h1>
            </div>
            {event.host && (
              <a href={`/u/${event.host.slug}`} className="mt-4 inline-flex items-center gap-2 hover:opacity-80">
                <Avatar size={28} src={event.host.profilePicture ?? undefined} alt={event.host.name} />
                <Text size="sm" color="textFaded">Hosted by {event.host.name}</Text>
              </a>
            )}
          </div>
        </header>

        <div className="grid gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section>
            <Text size="xl" weight="semibold">About the event</Text>
            <ThemedProse className="mt-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
              {event.content ? (
                <MentionedContent html={event.content} className="break-words" />
              ) : (
                <Text color="textFaded">No event description was provided.</Text>
              )}
            </ThemedProse>
          </section>

          <aside
            className="space-y-4 lg:border-l lg:pl-8"
            style={{ borderColor: `color-mix(in srgb, ${colors["text"]} 8%, transparent)` }}
          >
            <div>
              <div className="flex gap-3">
                <CalendarDays size={18} className="mt-0.5 shrink-0" style={{ color: colors["blue"] }} />
                <div>
                  <Text size="xs" color="textFaded">Starts</Text>
                  <Text size="sm" weight="semibold">{eventDateTimeFormat.format(start)}</Text>
                </div>
              </div>
              <div className="mt-4 flex gap-3 border-t pt-4" style={{ borderColor: `color-mix(in srgb, ${colors["text"]} 8%, transparent)` }}>
                <Clock3 size={18} className="mt-0.5 shrink-0" style={{ color: colors["blue"] }} />
                <div>
                  <Text size="xs" color="textFaded">Ends</Text>
                  <Text size="sm" weight="semibold">{eventDateTimeFormat.format(end)}</Text>
                </div>
              </div>
            </div>

            {event.link && (
              <Button
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                color="blue"
                className="w-full justify-center"
                leftSlot={<ExternalLink size={16} aria-hidden="true" />}
              >
                Open event link
              </Button>
            )}
          </aside>
        </div>
      </Card>
    </main>
  );
}
