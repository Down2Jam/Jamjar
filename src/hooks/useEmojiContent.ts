"use client";

import { useMemo } from "react";
import { replaceEmojiShortcodes } from "@/helpers/emoji";
import { useEmojis } from "@/providers/useEmojis";

export default function useEmojiContent(html: string) {
  const { emojiMap } = useEmojis();

  return useMemo(
    () => replaceEmojiShortcodes(html, emojiMap),
    [html, emojiMap]
  );
}
