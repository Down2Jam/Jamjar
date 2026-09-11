"use client";

import { useQuery } from "@tanstack/react-query";

import { getRecentAchievements } from "@/requests/achievement";
import type { RecentAchievementType } from "@/types/RecentAchievementType";
import { unwrapArray } from "./helpers";
import { queryKeys } from "./queryKeys";

export function useRecentAchievements(jamId?: number) {
  return useQuery<RecentAchievementType[]>({
    queryKey: queryKeys.achievement.recent(jamId),
    queryFn: async () => {
      const response = await getRecentAchievements(jamId);
      if (!response.ok) throw new Error("Failed to load recent achievements");
      return unwrapArray<RecentAchievementType>(await response.json());
    },
    staleTime: 2 * 60 * 1000,
  });
}
