"use client";

import { useState } from "react";
import { Avatar, Badge } from "bioloom-ui";
import { useRouter, useSearchParams } from "next/navigation";
import { EventFilter } from "@/types/EventFilter";
import { EventType } from "@/types/EventType";
import Link from "next/link";
import Timer from "../timers/Timer";
import { getIcon } from "@/helpers/icon";
import { Dropdown } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { IconName } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { Hstack } from "bioloom-ui";
import { navigateToSearchIfChanged } from "@/helpers/navigation";
import { useEvents, useSelf } from "@/hooks/queries";
import { hasCookie } from "@/helpers/cookie";

export default function Events() {
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<EventFilter>(
    (["upcoming", "current", "past"].includes(
      searchParams.get("filter") as EventFilter
    ) &&
      (searchParams.get("filter") as EventFilter)) ||
      "current"
  );
  const router = useRouter();

  const hasToken = hasCookie("token");
  const { data: events, isLoading: eventsLoading } = useEvents(filter);
  const { data: user, isLoading: userLoading } = useSelf(hasToken);

  const loading = eventsLoading || (hasToken && userLoading);

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    navigateToSearchIfChanged(router, params);
  };

  const filters: Record<
    EventFilter,
    { name: string; icon: IconName; description: string }
  > = {
    upcoming: {
      name: "Upcoming",
      icon: "clock",
      description: "Shows upcoming events",
    },
    current: {
      name: "Current",
      icon: "treedeciduous",
      description: "Shows currently running events",
    },
    past: {
      name: "Past",
      icon: "hourglass",
      description: "Shows past events",
    },
  };

  return (
    <div>
      {!loading && user?.twitch && (
        <Button icon="calendar" href="create-event">
          Create Event
        </Button>
      )}

      <div className="flex justify-between p-4 pb-0">
        <Dropdown
          onSelect={(key) => {
            setFilter(key as EventFilter);
            updateQueryParam("filter", key as string);
          }}
          trigger={<Button size="sm">{filters[filter]?.name}</Button>}
        >
          {Object.entries(filters).map(([key, filter]) => (
            <Dropdown.Item
              key={key}
              value={key}
              icon={filter.icon}
              description={filter.description}
            >
              {filter.name}
            </Dropdown.Item>
          ))}
        </Dropdown>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {events && events.length > 0 ? (
            <div className="flex flex-col w-[488px] gap-2">
              {events.map((event: EventType) => (
                <Card key={event.id} className="p-2">
                  <Hstack justify="between" gap={4}>
                    <Badge
                      content={getIcon(event.icon, 16)}
                      size={20}
                      className="min-w-8 min-h-8"
                    >
                      <Avatar src={event.host.profilePicture} />
                    </Badge>
                    <div className="flex flex-col gap-1 text-center">
                      <Link href={`/e/${event.slug}`}>{event.name}</Link>
                      {filter == "current" ? (
                        <Timer
                          name="Ends in"
                          targetDate={new Date(event.endTime)}
                        />
                      ) : filter == "upcoming" ? (
                        <Timer
                          name="Starts in"
                          targetDate={new Date(event.startTime)}
                        />
                      ) : (
                        <Timer
                          name="Ended"
                          reverse
                          targetDate={new Date(event.endTime)}
                        />
                      )}
                    </div>

                    <div>{event.link && <Button href={event.link} />}</div>
                  </Hstack>
                </Card>
              ))}
            </div>
          ) : (
            <Text>No events match your filters</Text>
          )}
        </div>
      )}
    </div>
  );
}
