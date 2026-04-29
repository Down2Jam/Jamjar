import { createContext } from "react";
import type { ReactionType } from "@/types/ReactionType";

export type EmojiType = ReactionType;

export type EmojiContextValue = {
  emojis: EmojiType[];
  emojiMap: Record<string, EmojiType>;
  loading: boolean;
  refresh: () => Promise<void>;
};

export const EmojiContext = createContext<EmojiContextValue | undefined>(
  undefined,
);
