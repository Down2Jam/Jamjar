import { useContext, useMemo } from "react";
import { EmojiContext } from "./EmojiContext";
import { PriorityEmotesContext } from "@/components/editor/PriorityEmotesContext";
export type { EmojiType } from "./EmojiContext";

export function useEmojis() {
  const context = useContext(EmojiContext);
  const priorityEmotes = useContext(PriorityEmotesContext);
  const pageContext = useMemo(() => {
    if (!context) return undefined;
    if (priorityEmotes.length === 0) return { ...context, priorityEmotes };
    const prioritySlugs = new Set(priorityEmotes.map((emoji) => emoji.slug));
    const emojis = [
      ...priorityEmotes,
      ...context.emojis.filter((emoji) => !prioritySlugs.has(emoji.slug)),
    ];
    return {
      ...context,
      emojis,
      emojiMap: {
        ...context.emojiMap,
        ...Object.fromEntries(priorityEmotes.map((emoji) => [emoji.slug, emoji])),
      },
      priorityEmotes,
    };
  }, [context, priorityEmotes]);
  if (!pageContext) {
    throw new Error("useEmojis must be used within EmojiProvider");
  }
  return pageContext;
}
