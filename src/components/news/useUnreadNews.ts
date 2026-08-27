"use client";

import { useEffect, useMemo, useState } from "react";
import { isGameReleaseFeedItem, type PostType } from "@/types/PostType";
import { usePosts, useTags } from "@/hooks/queries";
import {
  NEWS_READ_EVENT,
  NEWS_READ_STORAGE_KEY,
  newsTagRules,
} from "./news";

export function useUnreadNews() {
  const { data: tags } = useTags();
  const tagRules = useMemo(() => newsTagRules(tags), [tags]);
  const enabled = Boolean(tagRules && Object.keys(tagRules).length > 0);
  const { data: items } = usePosts(
    "newest",
    "all",
    false,
    tagRules,
    undefined,
    false,
    enabled,
  );
  const latest = (items ?? []).find(
    (item): item is PostType => !isGameReleaseFeedItem(item),
  );
  const [lastRead, setLastRead] = useState<string | null>();

  useEffect(() => {
    const readStoredValue = () => {
      setLastRead(localStorage.getItem(NEWS_READ_STORAGE_KEY));
    };
    readStoredValue();
    window.addEventListener("storage", readStoredValue);
    window.addEventListener(NEWS_READ_EVENT, readStoredValue);
    return () => {
      window.removeEventListener("storage", readStoredValue);
      window.removeEventListener(NEWS_READ_EVENT, readStoredValue);
    };
  }, []);

  if (!latest || lastRead === undefined) return false;
  return !lastRead || new Date(latest.createdAt).getTime() > new Date(lastRead).getTime();
}
