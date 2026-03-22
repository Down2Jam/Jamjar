"use client";

import { Avatar, Badge } from "bioloom-ui";
import { useEvents } from "@/hooks/queries";
import { EventType } from "@/types/EventType";
import Timer from "../timers/Timer";
import Link from "next/link";
import { getIcon } from "@/helpers/icon";
import { Text } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Hstack } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { useMemo } from "react";

export default function SidebarEvents() {
  const { data: currentEvents, isLoading: isLoadingCurrent } =
    useEvents("current");
  const { data: upcomingEvents, isLoading: isLoadingUpcoming } =
    useEvents("upcoming");

  const isLoading = isLoadingCurrent || isLoadingUpcoming;

  const events: EventType[] = useMemo(
    () => [...(currentEvents ?? []), ...(upcomingEvents ?? [])],
    [currentEvents, upcomingEvents]
  );

  if (isLoading) return <></>;

  if (
    events.filter((event) => new Date(event.endTime) > new Date()).length == 0
  )
    return <></>;

  return (
    <>
      <div className="flex flex-col gap-12 mt-10">
        {events.filter(
          (event) =>
            new Date(event.endTime) > new Date() &&
            new Date(event.startTime) <= new Date()
        ).length > 0 && (
          <div className="flex flex-col gap-2 items-center">
            <Text size="2xl" color="text">
              Active Events
            </Text>
            <div className="flex flex-col w-[488px] gap-2">
              {events
                .filter(
                  (event) =>
                    new Date(event.endTime) > new Date() &&
                    new Date(event.startTime) <= new Date()
                )
                ?.map((event) => (
                  <Card key={event.id}>
                    <Hstack justify="center" gap={4}>
                      <Badge
                        content={getIcon(event.icon, 16)}
                        size={20}
                        className="min-w-8 min-h-8"
                      >
                        <Avatar src={event.host.profilePicture} />
                      </Badge>
                      <div className="flex flex-col gap-1 text-center">
                        <Link href={`/e/${event.slug}`}>{event.name}</Link>
                        <Timer
                          name="Ends in"
                          targetDate={new Date(event.endTime)}
                        />
                      </div>

                      <div className="flex flex-row items-center gap-3">
                        {event.link && <Button href={event.link} />}
                      </div>
                    </Hstack>
                  </Card>
                ))}
            </div>
            <Button icon="moveupright" href="/events?filter=current">
              To Events Page
            </Button>
          </div>
        )}
        {events.filter((event) => new Date(event.startTime) > new Date())
          .length > 0 && (
          <div className="flex flex-col gap-2 items-center">
            <Text size="2xl" color="text">
              Upcoming Events
            </Text>
            <div className="flex flex-col w-[488px] gap-2">
              {events
                .filter((event) => new Date(event.startTime) > new Date())
                ?.map((event) => (
                  <Card key={event.id}>
                    <Hstack justify="center" gap={4}>
                      <Badge
                        content={getIcon(event.icon, 16)}
                        size={20}
                        className="min-w-8 min-h-8"
                      >
                        <Avatar src={event.host.profilePicture} />
                      </Badge>
                      <div className="flex flex-col gap-1 text-center">
                        <Link href={`/e/${event.slug}`}>{event.name}</Link>
                        <Timer
                          name="Starts in"
                          targetDate={new Date(event.startTime)}
                        />
                      </div>
                      <div className="flex flex-row items-center gap-3">
                        {event.link && <Button href={event.link} />}
                      </div>
                    </Hstack>
                  </Card>
                ))}
            </div>
            <Button icon="moveupright" href="/events?filter=upcoming">
              To Events Page
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
