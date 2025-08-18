"use client";

import ButtonLink from "@/components/link-components/ButtonLink";
import { getEvent } from "@/requests/event";
import { EventType } from "@/types/EventType";
import { Image, Spinner } from "@heroui/react";
import { BadgePlus, ExternalLink, TimerIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EventPage() {
  const [event, setEvent] = useState<EventType>();
  const { slug } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getEvent(`${slug}`);
      setEvent((await response.json()).data);
      setIsLoading(false);
    };

    fetchData();
  }, [slug]);

  if (isLoading) return <Spinner />;

  return (
    <>
      {event?.icon && (
        <div className="flex w-full justify-center items-center pt-4">
          <Image
            isBlurred
            isZoomed
            alt="Event image"
            className="aspect-square w-full hover:scale-110"
            height={300}
            src={event?.icon}
          />
        </div>
      )}
      <div className="flex flex-col gap-2 py-4">
        <h1 className="text-2xl fint-bold leading-7">{event?.name}</h1>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <div className="flex-none border-1 border-default-200/50 rounded-small text-center w-11 overflow-hidden">
              <div className="text-tiny bg-default-100 py-0.5 text-default-500">
                Start
              </div>
              <div className="flex items-center justify-center font-semibold text-medium h-6 text-default-500">
                <BadgePlus size={16} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-medium text-foreground font-medium">
                {new Date(event?.startTime.toString() as string).toDateString()}
              </p>
              <p className="text-small text-default-500">
                {new Date(event?.startTime.toString() as string).toTimeString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex-none border-1 border-default-200/50 rounded-small text-center w-11 overflow-hidden">
              <div className="text-tiny bg-default-100 py-0.5 text-default-500">
                End
              </div>
              <div className="flex items-center justify-center font-semibold text-medium h-6 text-default-500">
                <TimerIcon size={16} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-medium text-foreground font-medium">
                {new Date(event?.endTime.toString() as string).toDateString()}
              </p>
              <p className="text-small text-default-500">
                {new Date(event?.endTime.toString() as string).toTimeString()}
              </p>
            </div>
          </div>
        </div>
        {event?.content && (
          <div className="flex flex-col mt-4 gap-3 items-start">
            <span className="text-medium font-medium">About the event</span>
            <div className="text-medium text-default-500 flex flex-col gap-2">
              <p>{event?.content}</p>
            </div>
          </div>
        )}
        <div>
          {event?.link && (
            <ButtonLink
              icon={<ExternalLink />}
              name=""
              isIconOnly
              href={event.link}
            />
          )}
        </div>
      </div>
    </>
  );
}
