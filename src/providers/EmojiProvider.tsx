"use client";

import { BASE_URL } from "@/requests/config";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ReactionType } from "@/types/ReactionType";

export type EmojiType = ReactionType;

type EmojiContextValue = {
  emojis: EmojiType[];
  emojiMap: Record<string, EmojiType>;
  loading: boolean;
  refresh: () => Promise<void>;
};

const EmojiContext = createContext<EmojiContextValue | undefined>(undefined);

export function EmojiProvider({ children }: { children: ReactNode }) {
  const [emojis, setEmojis] = useState<EmojiType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmojis = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/emojis`);
      const data = await response.json();
      setEmojis(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to load emojis", error);
      setEmojis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmojis();
  }, [loadEmojis]);

  const emojiMap = useMemo(() => {
    const map: Record<string, EmojiType> = {};
    emojis.forEach((emoji) => {
      map[emoji.slug] = emoji;
    });
    return map;
  }, [emojis]);

  return (
    <EmojiContext.Provider
      value={{ emojis, emojiMap, loading, refresh: loadEmojis }}
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
