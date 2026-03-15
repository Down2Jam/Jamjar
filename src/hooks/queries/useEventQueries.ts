"use client";

import { useQuery } from "@tanstack/react-query";
import { getEvents, getEvent } from "@/requests/event";
import { queryKeys } from "./queryKeys";
import { unwrapArray, unwrapItem } from "./helpers";
import type { EventType } from "@/types/EventType";

export function useEvents(filter: string, enabled = true) {
  return useQuery<EventType[]>({
    queryKey: queryKeys.event.list(filter),
    queryFn: async () => {
      const res = await getEvents(filter);
      const json = await res.json();
      return unwrapArray<EventType>(json);
    },
    enabled,
  });
}

export function useEvent(slug: string, enabled = true) {
  return useQuery<EventType>({
    queryKey: queryKeys.event.detail(slug),
    queryFn: async () => {
      const res = await getEvent(slug);
      const json = await res.json();
      return unwrapItem<EventType>(json)!;
    },
    enabled: enabled && !!slug,
  });
}
