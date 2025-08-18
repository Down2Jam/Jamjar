"use client";

import { useEffect, useState } from "react";
import { Avatar, Badge } from "@heroui/react";
import { Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { EventFilter } from "@/types/EventFilter";
import { getEvents } from "@/requests/event";
import { EventType } from "@/types/EventType";
import Link from "next/link";
import Timer from "../timers/Timer";
import ButtonLink from "../link-components/ButtonLink";
import { UserType } from "@/types/UserType";
import { hasCookie } from "@/helpers/cookie";
import { getSelf } from "@/requests/user";
import { getIcon } from "@/helpers/icon";
import Dropdown from "@/framework/Dropdown";
import { Button } from "@/framework/Button";
import { IconName } from "@/framework/Icon";
import { Card } from "@/framework/Card";
import Text from "@/framework/Text";
import { Spinner } from "@/framework/Spinner";
import { Hstack } from "@/framework/Stack";

export default function Events() {
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<EventType[]>();
  const [filter, setFilter] = useState<EventFilter>(
    (["upcoming", "current", "past"].includes(
      searchParams.get("filter") as EventFilter
    ) &&
      (searchParams.get("filter") as EventFilter)) ||
      "current"
  );
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserType>();

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // Fetch events
        const eventsResponse = await getEvents(filter);
        setEvents((await eventsResponse.json()).data);

        if (!hasCookie("token")) {
          setUser(undefined);
          return;
        }

        const response = await getSelf();

        if (response.status == 200) {
          setUser(await response.json());
        } else {
          setUser(undefined);
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, [filter]);

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
        <ButtonLink
          name="Create Event"
          icon={<Calendar />}
          href="create-event"
        />
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
              {events.map((event) => (
                <Card key={event.id} className="p-2">
                  <Hstack justify="between" gap={4}>
                    <Badge
                      content={getIcon(event.icon, 16)}
                      size="sm"
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
