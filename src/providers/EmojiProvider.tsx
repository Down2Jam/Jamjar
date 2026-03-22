"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { ReactionType } from "@/types/ReactionType";
import { useEmojisQuery } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/queryKeys";

export type EmojiType = ReactionType;

type EmojiContextValue = {
  emojis: EmojiType[];
  emojiMap: Record<string, EmojiType>;
  loading: boolean;
  refresh: () => Promise<void>;
};

const EmojiContext = createContext<EmojiContextValue | undefined>(undefined);

export function EmojiProvider({ children }: { children: ReactNode }) {
  const { emojis, emojiMap, isLoading } = useEmojisQuery();
  const queryClient = useQueryClient();

  const refresh = useMemo(
    () => async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.emoji.list() });
    },
    [queryClient]
  );

  return (
    <EmojiContext.Provider
      value={{ emojis, emojiMap, loading: isLoading, refresh }}
    >
      {children}
    </EmojiContext.Provider>
  );
}

export function useEmojis() {
  const context = useContext(EmojiContext);
  if (!context) {
    throw new Error("useEmojis must be used within EmojiProvider");
  }
  return context;
}
