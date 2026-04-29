"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { useEmojisQuery } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { EmojiContext } from "./EmojiContext";

export function EmojiProvider({ children }: { children: ReactNode }) {
  const { emojis, emojiMap, isLoading } = useEmojisQuery();
  const queryClient = useQueryClient();

  const refresh = useMemo(
    () => async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.emoji.list() });
    },
    [queryClient]
  );
  const value = useMemo(
    () => ({ emojis, emojiMap, loading: isLoading, refresh }),
    [emojis, emojiMap, isLoading, refresh],
  );

  return (
    <EmojiContext.Provider value={value}>
      {children}
    </EmojiContext.Provider>
  );
}
