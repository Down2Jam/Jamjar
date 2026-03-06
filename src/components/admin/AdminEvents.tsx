"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/requests/event";
import type { EventType } from "@/types/EventType";
import type { EventFilter } from "@/types/EventFilter";
import { getIcon } from "@/helpers/icon";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  Hstack,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Text,
  Vstack,
} from "bioloom-ui";
import type { IconName } from "bioloom-ui";

const filters: Record<
  EventFilter,
  { name: string; description: string; icon: IconName }
> = {
  upcoming: {
    name: "Upcoming",
    description: "Scheduled events that have not started yet",
    icon: "clock",
  },
  current: {
    name: "Current",
    description: "Events running right now",
    icon: "treedeciduous",
  },
  past: {
    name: "Past",
    description: "Completed events",
    icon: "hourglass",
  },
};

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatEventWindow(start: string | Date, end: string | Date) {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Unknown window";
  }
  return `${dateTimeFormat.format(startDate)} - ${dateTimeFormat.format(
    endDate
  )}`;
}

export default function AdminEvents() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventFilter>("upcoming");

  useEffect(() => {
    let active = true;

    const loadEvents = async () => {
      setLoading(true);
      try {
        const response = await getEvents(filter);
        if (!active) return;
        if (response.ok) {
          const data = await response.json();
          setEvents(data.data ?? []);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error("Failed to load events", error);
        if (active) setEvents([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <main className="flex flex-col gap-6 pb-10">
      <section className="flex flex-col gap-3">
        <Vstack align="stretch" gap={1}>
          <Text size="3xl" weight="bold">
            Event Control
          </Text>
          <Text size="sm" color="textFaded">
            Schedule jam streams and keep the public calendar up to date.
          </Text>
        </Vstack>
        <Hstack wrap>
          <Button color="blue" href="/create-event" icon="calendarplus">
            Create Event
          </Button>
          <Button href="/events" icon="calendar">
            View Public Events
          </Button>
        </Hstack>
      </section>

      <Card>
        <Vstack align="stretch" gap={3}>
          <Hstack justify="between">
            <Text size="lg" weight="semibold">
              Events
            </Text>
            <Dropdown
              trigger={<Button size="sm">{filters[filter].name}</Button>}
              onSelect={(key) => {
                setFilter(key as EventFilter);
              }}
            >
              {Object.entries(filters).map(([key, value]) => (
                <Dropdown.Item
                  key={key}
                  value={key}
                  icon={value.icon}
                  description={value.description}
                >
                  {value.name}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </Hstack>

          {loading ? (
            <Spinner />
          ) : events.length === 0 ? (
            <Text size="sm" color="textFaded">
              No events found for this filter.
            </Text>
          ) : (
            <Table>
              <TableHeader>
                <TableColumn>Event</TableColumn>
                <TableColumn>Window</TableColumn>
                <TableColumn>Host</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Hstack>
                        <Badge
                          content={getIcon(event.icon, 14)}
                          size={20}
                          className="min-w-7"
                        >
                          <Avatar
                            src={event.host?.profilePicture}
                            alt={event.host?.name ?? "Host"}
                            size={28}
                          />
                        </Badge>
                        <Vstack align="start" gap={0}>
                          <Text size="sm">{event.name}</Text>
                          <Text size="xs" color="textFaded">
                            {event.slug}
                          </Text>
                        </Vstack>
                      </Hstack>
                    </TableCell>
                    <TableCell>
                      <Text size="sm">
                        {formatEventWindow(event.startTime, event.endTime)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm">{event.host?.name ?? "Unknown"}</Text>
                    </TableCell>
                    <TableCell>
                      <Hstack>
                        <Button size="sm" href={`/e/${event.slug}`}>
                          Open
                        </Button>
                        {event.link && (
                          <Button
                            size="sm"
                            variant="ghost"
                            href={event.link}
                            icon="link"
                          >
                            Link
                          </Button>
                        )}
                      </Hstack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Vstack>
      </Card>
    </main>
  );
}
