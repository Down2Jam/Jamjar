"use client";

import { useQuery } from "@tanstack/react-query";
import { getEmojis, getStickers } from "@/requests/emoji";
import { queryKeys } from "./queryKeys";
import { useMemo } from "react";
import type { ReactionType } from "@/types/ReactionType";

export type EmojiType = ReactionType;

export function useEmojisQuery() {
  const emojiQuery = useQuery({
    queryKey: queryKeys.emoji.list(),
    queryFn: async () => {
      const res = await getEmojis();
      const data = await res.json();
      return (Array.isArray(data?.data) ? data.data : []) as EmojiType[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const stickerQuery = useQuery({
    queryKey: queryKeys.sticker.list(),
    queryFn: async () => {
      const res = await getStickers();
      const data = await res.json();
      return (Array.isArray(data?.data) ? data.data : []) as EmojiType[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const emojiMap = useMemo(() => {
    const map: Record<string, EmojiType> = {};
    (emojiQuery.data ?? []).forEach((emoji) => {
      map[emoji.slug] = emoji;
    });
    return map;
  }, [emojiQuery.data]);

  const stickerMap = useMemo(() => {
    const map: Record<string, EmojiType> = {};
    (stickerQuery.data ?? []).forEach((sticker) => {
      map[sticker.slug] = sticker;
    });
    return map;
  }, [stickerQuery.data]);

  return {
    ...emojiQuery,
    isLoading: emojiQuery.isLoading || stickerQuery.isLoading,
    emojis: emojiQuery.data ?? [],
    emojiMap,
    stickers: stickerQuery.data ?? [],
    stickerMap,
  };
}
