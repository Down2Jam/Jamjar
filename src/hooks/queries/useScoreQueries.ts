"use client";

import { useQuery } from "@tanstack/react-query";

import { getRecentScores } from "@/requests/score";
import type { RecentScoreType } from "@/types/RecentScoreType";
import { unwrapArray } from "./helpers";
import { queryKeys } from "./queryKeys";

export function useRecentScores() {
  return useQuery<RecentScoreType[]>({
    queryKey: queryKeys.score.recent(),
    queryFn: async () => {
      const response = await getRecentScores();
      if (!response.ok) throw new Error("Failed to load recent scores");
      return unwrapArray<RecentScoreType>(await response.json());
    },
    staleTime: 2 * 60 * 1000,
  });
}
