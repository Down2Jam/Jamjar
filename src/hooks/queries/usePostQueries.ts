"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getPosts, getPost } from "@/requests/post";
import { PostTime } from "@/types/PostTimes";
import { queryKeys } from "./queryKeys";
import { unwrapItem } from "./helpers";
import type { PostType } from "@/types/PostType";

type PostsPage = {
  items: PostType[];
  pageInfo: {
    hasMore: boolean;
    nextCursor: string | null;
  };
};

type PostsPageResponse =
  | PostType[]
  | {
      items?: PostType[];
      data?: PostType[] | { items?: PostType[]; pageInfo?: PostsPage["pageInfo"] };
      meta?: { pageInfo?: PostsPage["pageInfo"] };
      pageInfo?: PostsPage["pageInfo"];
    };

function readPostsPage(json: PostsPageResponse): PostsPage {
  if (Array.isArray(json)) {
    return {
      items: json,
      pageInfo: { hasMore: false, nextCursor: null },
    };
  }

  if (Array.isArray(json.data)) {
    return {
      items: json.data,
      pageInfo: json.meta?.pageInfo ??
        json.pageInfo ?? { hasMore: false, nextCursor: null },
    };
  }

  if (json.data && !Array.isArray(json.data)) {
    return {
      items: json.data.items ?? [],
      pageInfo: json.data.pageInfo ??
        json.meta?.pageInfo ??
        json.pageInfo ?? { hasMore: false, nextCursor: null },
    };
  }

  return {
    items: json.items ?? [],
    pageInfo: json.pageInfo ??
      json.meta?.pageInfo ?? { hasMore: false, nextCursor: null },
  };
}

export function usePosts(
  sort: string,
  time: PostTime,
  sticky: boolean,
  tagRules?: Record<number, number>,
  userSlug?: string,
  following = false,
  enabled = true
) {
  return useInfiniteQuery<PostsPage, Error, PostType[], ReturnType<typeof queryKeys.post.list>, string | null>({
    queryKey: queryKeys.post.list(sort, time, sticky, tagRules, userSlug, following),
    queryFn: async ({ pageParam }) => {
      const res = await getPosts(
        sort,
        time,
        sticky,
        tagRules,
        userSlug,
        following,
        pageParam,
        20,
      );
      const json = (await res.json()) as PostsPageResponse;
      return readPostsPage(json);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore ? lastPage.pageInfo.nextCursor : undefined,
    select: (data) => data.pages.flatMap((page) => page.items),
    enabled,
    placeholderData: keepPreviousData,
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
