"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCurrentGame,
  getGame,
  getGames,
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
) {
  return useQuery<GameType[]>({
    queryKey: queryKeys.game.list(sort, jamId, pageVersion),
    queryFn: async () => {
      const res = await getGames(sort, jamId, pageVersion);
      const json = await res.json();
      return unwrapArray<GameType>(json);
    },
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
