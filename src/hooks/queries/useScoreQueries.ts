"use client";

import { useQuery } from "@tanstack/react-query";

import { getRecentScores } from "@/requests/score";
import type { RecentScoreType } from "@/types/RecentScoreType";
import { unwrapArray } from "./helpers";
import { queryKeys } from "./queryKeys";

export function useRecentScores(jamId?: number) {
  return useQuery<RecentScoreType[]>({
    queryKey: queryKeys.score.recent(jamId),
    queryFn: async () => {
      const response = await getRecentScores(jamId);
      if (!response.ok) throw new Error("Failed to load recent scores");
      return unwrapArray<RecentScoreType>(await response.json());
    },
    staleTime: 2 * 60 * 1000,
  });
}
