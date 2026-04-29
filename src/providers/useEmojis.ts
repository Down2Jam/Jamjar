import { useContext } from "react";
import { EmojiContext } from "./EmojiContext";
export type { EmojiType } from "./EmojiContext";

export function useEmojis() {
  const context = useContext(EmojiContext);
  if (!context) {
    throw new Error("useEmojis must be used within EmojiProvider");
  }
  return context;
}
