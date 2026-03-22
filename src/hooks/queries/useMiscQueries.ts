"use client";

import { useQuery } from "@tanstack/react-query";
import { getTags } from "@/requests/tag";
import { getStreamers } from "@/requests/streamer";
import { getAdminImages } from "@/requests/admin";
import { BASE_URL } from "@/requests/config";
import { queryKeys } from "./queryKeys";
import type { TagType } from "@/types/TagType";
import type { FeaturedStreamerType } from "@/types/FeaturedStreamerType";
import type { TrackType } from "@/types/TrackType";
import type { SiteThemeType } from "@/types/SiteThemeType";
import { unwrapArray } from "./helpers";

export function useTags() {
  return useQuery<TagType[]>({
    queryKey: queryKeys.tag.list(),
    queryFn: async () => {
      const res = await getTags();
      const json = await res.json();
      return unwrapArray<TagType>(json);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useStreamers(enabled = true) {
  return useQuery<FeaturedStreamerType[]>({
    queryKey: queryKeys.streamer.list(),
    queryFn: async () => {
      const res = await getStreamers();
      const json = await res.json();
      return unwrapArray<FeaturedStreamerType>(json);
    },
    enabled,
  });
}

export function useAdminImages(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.images(),
    queryFn: async () => {
      const res = await getAdminImages();
      const json = await res.json();
      return unwrapArray(json);
    },
    enabled,
  });
}

export function useTracks() {
  return useQuery<TrackType[]>({
    queryKey: queryKeys.track.list(),
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/tracks`);
      const data = await res.json();
      return data.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSiteThemes() {
  return useQuery<SiteThemeType[]>({
    queryKey: queryKeys.siteTheme.list(),
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/site-themes`);
      const json = await res.json();
      return unwrapArray<SiteThemeType>(json);
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search.results(query),
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/search?q=${encodeURIComponent(query)}`
      );
      const json = await res.json();
      return json?.data ?? json ?? null;
    },
    enabled: enabled && query.length > 0,
  });
}
