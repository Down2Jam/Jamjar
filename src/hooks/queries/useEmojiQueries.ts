"use client";

import { useQuery } from "@tanstack/react-query";
import { getEmojis } from "@/requests/emoji";
import { queryKeys } from "./queryKeys";
import { useMemo } from "react";
import type { ReactionType } from "@/types/ReactionType";

export type EmojiType = ReactionType;

export function useEmojisQuery() {
  const query = useQuery({
    queryKey: queryKeys.emoji.list(),
    queryFn: async () => {
      const res = await getEmojis();
      const data = await res.json();
      return (Array.isArray(data?.data) ? data.data : []) as EmojiType[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const emojiMap = useMemo(() => {
    const map: Record<string, EmojiType> = {};
    (query.data ?? []).forEach((emoji) => {
      map[emoji.slug] = emoji;
    });
    return map;
  }, [query.data]);

  return {
    ...query,
    emojis: query.data ?? [],
    emojiMap,
  };
}
