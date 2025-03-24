"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import {
  TreeDeciduous,
  Hourglass,
  Clock,
  LoaderCircle,
  Bell,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import ButtonAction from "../link-components/ButtonAction";
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
    { name: string; icon: ReactNode; description: string }
  > = {
    upcoming: {
      name: "Upcoming",
      icon: <Clock />,
      description: "Shows upcoming events",
    },
    current: {
      name: "Current",
      icon: <TreeDeciduous />,
      description: "Shows currently running events",
    },
    past: {
      name: "Past",
      icon: <Hourglass />,
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
        <Dropdown backdrop="opaque">
          <DropdownTrigger>
            <Button
              size="sm"
              className="text-xs bg-white dark:bg-[#252525] !duration-250 !ease-linear !transition-all text-[#333] dark:text-white"
              variant="faded"
            >
              {filters[filter]?.name}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            onAction={(key) => {
              setFilter(key as EventFilter);
              updateQueryParam("filter", key as string);
            }}
            className="text-[#333] dark:text-white"
          >
            {Object.entries(filters).map(([key, filter]) => (
              <DropdownItem
                key={key}
                startContent={filter.icon}
                description={filter.description}
              >
                {filter.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <LoaderCircle
            className="animate-spin text-[#333] dark:text-[#999]"
            size={24}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {events && events.length > 0 ? (
            <div className="flex flex-col w-[488px] gap-2">
              {events.map((event) => (
                <Card key={event.id} className="p-2">
                  <CardBody className="flex-row justify-between items-center">
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

                    <div className="flex flex-row items-center gap-3">
                      {filter == "upcoming" && (
                        <ButtonAction
                          icon={<Bell />}
                          name=""
                          onPress={() => {
                            toast.warning("Event notifications coming soon");
                          }}
                          isIconOnly
                        />
                      )}
                      {event.link && (
                        <ButtonLink
                          icon={<ExternalLink />}
                          name=""
                          isIconOnly
                          href={event.link}
                        />
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#333] dark:text-white transition-color duration-250 ease-linear">
              No events match your filters
            </p>
          )}
          <div>
            {events && (
              <ButtonAction
                name="Load More Events"
                onPress={() => {
                  toast.warning("Event pagination coming soon");
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
