"use client";

import { useMemo, useState } from "react";
import { Button, Spinner } from "bioloom-ui";
import { isGameReleaseFeedItem, type PostType } from "@/types/PostType";
import { usePosts, useSelf, useTags } from "@/hooks/queries";
import NewsArticlePreview from "./NewsArticlePreview";
import { isNewsTag, newsTagRules, normalizeNewsTag } from "./news";
import { useTheme } from "@/providers/useSiteTheme";

type NewsFilter = "all" | "announcement" | "changelog";

export default function NewsFeed() {
  const { colors, siteTheme } = useTheme();
  const backgroundTextColor =
    siteTheme.type === "Light" ? colors["textLight"] : colors["text"];
  const [filter, setFilter] = useState<NewsFilter>("all");
  const { data: user } = useSelf();
  const { data: tags, isLoading: tagsLoading, isError: tagsError } = useTags();
  const tagRules = useMemo(() => {
    if (filter === "all") return newsTagRules(tags);
    const wanted = filter === "announcement" ? "siteannouncement" : "sitechangelog";
    return newsTagRules(
      tags?.filter((tag) => isNewsTag(tag) && normalizeNewsTag(tag.name) === wanted),
    );
  }, [filter, tags]);
  const hasNewsTags = Boolean(tagRules && Object.keys(tagRules).length > 0);
  const {
    data: items,
    isLoading: postsLoading,
    isError: postsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = usePosts(
    "newest",
    "all",
    false,
    tagRules,
    user?.slug,
    false,
    hasNewsTags,
  );
  const posts = useMemo(
    () =>
      (items ?? []).filter(
        (item): item is PostType => !isGameReleaseFeedItem(item),
      ),
    [items],
  );

  if (tagsLoading || postsLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  if (tagsError || postsError) {
    return <p style={{ color: backgroundTextColor }}>News could not be loaded right now.</p>;
  }

  if (!hasNewsTags || posts.length === 0) {
    return <p style={{ color: backgroundTextColor }}>There is no news to share yet.</p>;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Filter news">
        <span className="text-sm" style={{ color: backgroundTextColor }}>Show:</span>
        {([
          ["all", "All news"],
          ["announcement", "Announcements"],
          ["changelog", "Changelogs"],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "standard" : "ghost"}
            color={filter === value ? "red" : "default"}
            style={filter === value ? undefined : { color: backgroundTextColor }}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <section aria-labelledby="latest-news-title">
        <h2 id="latest-news-title" className="sr-only">Latest news</h2>
        <NewsArticlePreview post={posts[0]} featured />
      </section>
      {posts.length > 1 && (
        <section className="mt-10" aria-labelledby="more-news-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="more-news-title"
              className="text-2xl font-semibold"
              style={{ color: backgroundTextColor }}
            >
              More news
            </h2>
            <span className="text-sm" style={{ color: backgroundTextColor }}>
              {posts.length - 1} {posts.length === 2 ? "story" : "stories"}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {posts.slice(1).map((post) => (
              <NewsArticlePreview key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
      {hasNextPage && (
        <div className="flex justify-center py-8">
          <Button
            loading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more news
          </Button>
        </div>
      )}
    </>
  );
}
