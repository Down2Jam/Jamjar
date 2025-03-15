"use client";

import { Avatar, Badge, Card, CardBody, Spinner } from "@nextui-org/react";
import ButtonAction from "../link-components/ButtonAction";
import { Bell, ExternalLink, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { getEvents } from "@/requests/event";
import { EventType } from "@/types/EventType";
import ButtonLink from "../link-components/ButtonLink";
import Timer from "../timers/Timer";
import { toast } from "react-toastify";
import Link from "next/link";
import { getIcon } from "@/helpers/icon";

export default function SidebarEvents() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const eventResponse = await getEvents("current");
        const eventResponse2 = await getEvents("upcoming");
        setEvents([
          ...(await eventResponse.json()).data,
          ...(await eventResponse2.json()).data,
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-12">
      {events.filter(
        (event) =>
          new Date(event.endTime) > new Date() &&
          new Date(event.startTime) <= new Date()
      ).length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-center text-2xl text-[#333] dark:text-white">
            Active Events
          </p>
          <div className="flex flex-col w-[488px] gap-2">
            {events
              .filter(
                (event) =>
                  new Date(event.endTime) > new Date() &&
                  new Date(event.startTime) <= new Date()
              )
              ?.map((event) => (
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
                      <Timer
                        name="Ends in"
                        targetDate={new Date(event.endTime)}
                      />
                    </div>

                    <div className="flex flex-row items-center gap-3">
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
          <div className="flex justify-center gap-2">
            <ButtonAction
              icon={<MoreHorizontal />}
              name="Load More"
              onPress={() => {
                toast.warning("Event pagination coming soon");
              }}
            />
            <ButtonLink
              icon={<ExternalLink />}
              name="To Events Page"
              href={`/events?filter=current`}
            />
          </div>
        </div>
      )}
      {events.filter((event) => new Date(event.startTime) > new Date()).length >
        0 && (
        <div className="flex flex-col gap-2">
          <p className="text-center text-2xl text-[#333] dark:text-white">
            Upcoming Events
          </p>
          <div className="flex flex-col w-[488px] gap-2">
            {events
              .filter((event) => new Date(event.startTime) > new Date())
              ?.map((event) => (
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
                      <Timer
                        name="Starts in"
                        targetDate={new Date(event.startTime)}
                      />
                    </div>
                    <div className="flex flex-row items-center gap-3">
                      <ButtonAction
                        icon={<Bell />}
                        name=""
                        onPress={() => {
                          toast.warning("Event notifications coming soon");
                        }}
                        isIconOnly
                      />
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
          <div className="flex justify-center gap-2">
            <ButtonAction
              icon={<MoreHorizontal />}
              name="Load More"
              onPress={() => {
                toast.warning("Event pagination coming soon");
              }}
            />
            <ButtonLink
              icon={<ExternalLink />}
              name="To Events Page"
              href={`/events?filter=upcoming`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
