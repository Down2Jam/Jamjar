"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getCurrentGame,
  getGame,
  getGamesPage,
  getRatingCategories,
  getFlags,
  getGameTags,
  getResults,
} from "@/requests/game";
import { queryKeys } from "./queryKeys";
import { unwrapArray, unwrapItem } from "./helpers";
import type { GameType } from "@/types/GameType";
import type { ListingPageVersion } from "@/types/GameType";
import type { RatingCategoryType } from "@/types/RatingCategoryType";
import type { FlagType } from "@/types/FlagType";
import type { GameTagType } from "@/types/GameTagType";
import type { GameResultType } from "@/types/GameResultType";

type PaginatedGamesResponse = {
  items?: GameType[];
  data?: GameType[] | {
    items?: GameType[];
    pageInfo?: {
      hasMore?: boolean;
      nextCursor?: string | null;
    };
  };
  meta?: {
    pageInfo?: {
      hasMore?: boolean;
      nextCursor?: string | null;
    };
  };
  pageInfo?: {
    hasMore?: boolean;
    nextCursor?: string | null;
  };
};

function readGamesPage(json: PaginatedGamesResponse | GameType[]) {
  if (Array.isArray(json)) {
    return { games: json, pageInfo: null };
  }

  if (Array.isArray(json.data)) {
    return {
      games: json.data,
      pageInfo: json.meta?.pageInfo ?? json.pageInfo ?? null,
    };
  }

  if (json.data && !Array.isArray(json.data)) {
    return {
      games: json.data.items ?? [],
      pageInfo: json.data.pageInfo ?? json.meta?.pageInfo ?? json.pageInfo ?? null,
    };
  }

  return {
    games: json.items ?? [],
    pageInfo: json.pageInfo ?? json.meta?.pageInfo ?? null,
  };
}

export function useCurrentGame(enabled = true) {
  return useQuery<GameType[]>({
    queryKey: queryKeys.game.current(),
    queryFn: async () => {
      const res = await getCurrentGame();
      const json = await res.json();
      return unwrapArray<GameType>(json);
    },
    enabled,
  });
}

export function useGame(slug: string, enabled = true) {
  return useQuery<GameType>({
    queryKey: queryKeys.game.detail(slug),
    queryFn: async () => {
      const res = await getGame(slug);
      const json = await res.json();
      return unwrapItem<GameType>(json)!;
    },
    enabled: enabled && !!slug,
  });
}

export function useGames(
  sort: string,
  jamId?: string,
  pageVersion?: ListingPageVersion,
  enabled = true,
  limit?: number,
) {
  return useQuery<GameType[]>({
    queryKey: queryKeys.game.list(sort, jamId, pageVersion, limit),
    queryFn: async () => {
      const allGames: GameType[] = [];
      const seen = new Set<string>();
      let cursor: string | null = null;
      const pageLimit = limit ? Math.min(Math.max(limit, 1), 50) : 50;

      for (let page = 0; page < 100; page += 1) {
        const res = await getGamesPage({
          sort,
          jamId,
          pageVersion,
          cursor,
          limit: pageLimit,
        });
        const json = (await res.json()) as PaginatedGamesResponse | GameType[];
        const { games: pageGames, pageInfo } = readGamesPage(json);

        pageGames.forEach((game) => {
          const key = `${game.id}:${game.pageVersion ?? "JAM"}`;
          if (!seen.has(key)) {
            seen.add(key);
            allGames.push(game);
          }
        });

        if (limit && allGames.length >= limit) {
          break;
        }

        if (!pageInfo?.hasMore) {
          break;
        }

        cursor = pageInfo.nextCursor ?? null;
        if (!cursor) {
          break;
        }
      }

      return limit ? allGames.slice(0, limit) : allGames;
    },
    enabled,
  });
}

export function useGamesInfinite(
  sort: string,
  jamId?: string,
  pageVersion?: ListingPageVersion,
  enabled = true,
  limit = 24,
) {
  const pageLimit = Math.min(Math.max(limit, 1), 50);

  return useInfiniteQuery({
    queryKey: [...queryKeys.game.list(sort, jamId, pageVersion, pageLimit), "infinite"] as const,
    queryFn: async ({ pageParam }: { pageParam?: string | null }) => {
      const res = await getGamesPage({
        sort,
        jamId,
        pageVersion,
        cursor: pageParam ?? null,
        limit: pageLimit,
      });
      const json = (await res.json()) as PaginatedGamesResponse | GameType[];
      const { games, pageInfo } = readGamesPage(json);
      return {
        games,
        pageInfo,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo?.hasMore ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
    enabled,
  });
}

export function useRatingCategories(always = false) {
  return useQuery<RatingCategoryType[]>({
    queryKey: queryKeys.game.ratingCategories(always),
    queryFn: async () => {
      const res = await getRatingCategories(always);
      const json = await res.json();
      return unwrapArray<RatingCategoryType>(json);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useFlags() {
  return useQuery<FlagType[]>({
    queryKey: queryKeys.game.flags(),
    queryFn: async () => {
      const res = await getFlags();
      const json = await res.json();
      return unwrapArray<FlagType>(json);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useGameTags() {
  return useQuery<GameTagType[]>({
    queryKey: queryKeys.game.tags(),
    queryFn: async () => {
      const res = await getGameTags();
      const json = await res.json();
      return unwrapArray<GameTagType>(json);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useResults(
  category: string,
  contentType: string,
  sort: string,
  jam: string,
  enabled = true
) {
  return useQuery<GameResultType[]>({
    queryKey: queryKeys.game.results(category, contentType, sort, jam),
    queryFn: async () => {
      const res = await getResults(category, contentType, sort, jam);
      const json = await res.json();
      return unwrapArray<GameResultType>(json);
    },
    enabled,
  });
}
