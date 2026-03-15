"use client";

import { useQuery } from "@tanstack/react-query";
import { getPosts, getPost } from "@/requests/post";
import { PostTime } from "@/types/PostTimes";
import { queryKeys } from "./queryKeys";
import { unwrapArray, unwrapItem } from "./helpers";
import type { PostType } from "@/types/PostType";

export function usePosts(
  sort: string,
  time: PostTime,
  sticky: boolean,
  tagRules?: Record<number, number>,
  userSlug?: string,
  enabled = true
) {
  return useQuery<PostType[]>({
    queryKey: queryKeys.post.list(sort, time, sticky, tagRules, userSlug),
    queryFn: async () => {
      const res = await getPosts(sort, time, sticky, tagRules, userSlug);
      const json = await res.json();
      return unwrapArray<PostType>(json);
    },
    enabled,
  });
}

export function usePost(slug: string, userSlug?: string, enabled = true) {
  return useQuery<PostType>({
    queryKey: queryKeys.post.detail(slug, userSlug),
    queryFn: async () => {
      const res = await getPost(slug, userSlug);
      const json = await res.json();
      return unwrapItem<PostType>(json)!;
    },
    enabled: enabled && !!slug,
  });
}
