"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getThemeSuggestions,
  getTheme,
  getThemes,
  getThemeVotes,
} from "@/requests/theme";
import { queryKeys } from "./queryKeys";
import type { ThemeType } from "@/types/ThemeType";
import { unwrapArray, unwrapItem } from "./helpers";

export function useTheme() {
  return useQuery<ThemeType | null>({
    queryKey: queryKeys.theme.current(),
    queryFn: async () => {
      const res = await getTheme();
      const json = await res.json();
      return unwrapItem<ThemeType>(json);
    },
  });
}

export function useThemeSuggestions(enabled = true) {
  return useQuery<ThemeType[]>({
    queryKey: queryKeys.theme.suggestions(),
    queryFn: async () => {
      const res = await getThemeSuggestions();
      const json = await res.json();
      return unwrapArray<ThemeType>(json);
    },
    enabled,
  });
}

export function useThemes(isVoting = false, enabled = true) {
  return useQuery<ThemeType[]>({
    queryKey: queryKeys.theme.list(isVoting),
    queryFn: async () => {
      const res = await getThemes(isVoting);
      const json = await res.json();
      return unwrapArray<ThemeType>(json);
    },
    enabled,
  });
}

export function useThemeVotes(enabled = true) {
  return useQuery({
    queryKey: queryKeys.theme.votes(),
    queryFn: async () => {
      const res = await getThemeVotes();
      const json = await res.json();
      return unwrapItem(json);
    },
    enabled,
  });
}
