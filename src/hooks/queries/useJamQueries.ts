"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCurrentJam,
  hasJoinedCurrentJam,
  type ActiveJamResponse,
} from "@/helpers/jam";
import * as jamRequests from "@/requests/jam";
import { queryKeys } from "./queryKeys";
import type { JamType } from "@/types/JamType";
import { unwrapArray } from "./helpers";

export function useCurrentJam() {
  return useQuery<ActiveJamResponse | null>({
    queryKey: queryKeys.jam.current(),
    queryFn: getCurrentJam,
    staleTime: 5 * 60 * 1000,
  });
}

export function useJams() {
  return useQuery<JamType[]>({
    queryKey: queryKeys.jam.list(),
    queryFn: async () => {
      const res = await jamRequests.getJams();
      const json = await res.json();
      return unwrapArray<JamType>(json);
    },
  });
}

export function useHasJoinedCurrentJam(enabled = true) {
  return useQuery<boolean>({
    queryKey: queryKeys.jam.participation(),
    queryFn: hasJoinedCurrentJam,
    enabled,
  });
}
