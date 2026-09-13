"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Avatar, Badge } from "bioloom-ui";
import { useEvents } from "@/hooks/queries";
import { EventType } from "@/types/EventType";
import { isStreamEventIcon } from "@/types/EventIcon";
import SidebarSectionTitle from "./SidebarSectionTitle";
import Timer from "../timers/Timer";
import Link from "@/compat/next-link";
import { getIcon } from "@/helpers/icon";
import { Text } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Hstack } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { useMemo } from "react";
import { SidebarCardSkeleton } from "@/components/skeletons";
import useBreakpoint from "@/hooks/useBreakpoint";

export default function SidebarEvents() {
  const uiText = useUiTranslations();
  const { width, isXlUp } = useBreakpoint();
  const timerSize = isXlUp ? "md" : width >= 1024 ? "sm" : "xs";
  const buttonSize = isXlUp ? "md" : "sm";
  const { data: currentEvents, isLoading: isLoadingCurrent } =
    useEvents("current");
  const { data: upcomingEvents, isLoading: isLoadingUpcoming } =
    useEvents("upcoming");

  const isLoading = isLoadingCurrent || isLoadingUpcoming;

  const events: EventType[] = useMemo(
    () => [...(currentEvents ?? []), ...(upcomingEvents ?? [])],
    [currentEvents, upcomingEvents]
  );

  const now = new Date();
  const activeEvents = events.filter(
    (event) =>
      new Date(event.endTime) > now &&
      new Date(event.startTime) <= now &&
      !isStreamEventIcon(event.icon),
  );
  const upcomingEventList = events.filter(
    (event) => new Date(event.startTime) > now,
  );

  if (isLoading) return <SidebarCardSkeleton lines={2} className="mt-6" />;

  if (activeEvents.length === 0 && upcomingEventList.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-12 mt-6">
        {activeEvents.length > 0 && (
          <div className="flex flex-col gap-2 items-center">
            <SidebarSectionTitle>
               {uiText("SidebarEvents.Active.Title")} </SidebarSectionTitle>
            <div className="flex w-full flex-col gap-2">
              {activeEvents.map((event) => (
                  <Card key={event.id}>
                    <Hstack justify="center" gap={isXlUp ? 4 : 2}>
                      <Badge
                        content={getIcon(event.icon, 16)}
                        size={20}
                        className="min-w-8 min-h-8"
                      >
                        <Avatar src={event.host.profilePicture ?? undefined} />
                      </Badge>
                      <div className="flex flex-col gap-1 text-center">
                        <Link href={`/e/${event.slug}`}>{event.name}</Link>
                        {isXlUp && (
                          <Timer
                            name={uiText("AppStrings.EndsIn")}
                            targetDate={new Date(event.endTime)}
                          />
                        )}
                      </div>

                      <div className="flex flex-row items-center gap-3">
                        {event.link && <Button href={event.link} />}
                      </div>
                    </Hstack>
                    {!isXlUp && (
                      <div className="mt-2">
                        <Timer
                          name={uiText("AppStrings.EndsIn")}
                          targetDate={new Date(event.endTime)}
                          size={timerSize}
                        />
                      </div>
                    )}
                  </Card>
                ))}
            </div>
            <Button icon="moveupright" href="/events?filter=current" size={buttonSize}>
               {uiText("SidebarEvents.Link")} </Button>
          </div>
        )}
        {upcomingEventList.length > 0 && (
          <div className="flex flex-col gap-2 items-center">
            <SidebarSectionTitle>
               {uiText("SidebarEvents.Upcoming.Title")} </SidebarSectionTitle>
            <div className="flex w-full flex-col gap-2">
              {upcomingEventList.map((event) => (
                  <Card key={event.id}>
                    <Hstack justify="center" gap={isXlUp ? 4 : 2}>
                      <Badge
                        content={getIcon(event.icon, 16)}
                        size={20}
                        className="min-w-8 min-h-8"
                      >
                        <Avatar src={event.host.profilePicture ?? undefined} />
                      </Badge>
                      <div className="flex flex-col gap-1 text-center">
                        <Link href={`/e/${event.slug}`}>{event.name}</Link>
                        {isXlUp && (
                          <Timer
                            name={uiText("AppStrings.StartsIn")}
                            targetDate={new Date(event.startTime)}
                          />
                        )}
                      </div>
                      <div className="flex flex-row items-center gap-3">
                        {event.link && <Button href={event.link} />}
                      </div>
                    </Hstack>
                    {!isXlUp && (
                      <div className="mt-2">
                        <Timer
                          name={uiText("AppStrings.StartsIn")}
                          targetDate={new Date(event.startTime)}
                          size={timerSize}
                        />
                      </div>
                    )}
                  </Card>
                ))}
            </div>
            <Button icon="moveupright" href="/events?filter=upcoming" size={buttonSize}>
               {uiText("SidebarEvents.Link")} </Button>
          </div>
        )}
      </div>
    </>
  );
}
