import { createContext } from "react";
import type { EmojiType } from "@/providers/useEmojis";

export const PriorityEmotesContext = createContext<EmojiType[]>([]);
