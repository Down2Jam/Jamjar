"use client";

import Link from "@/compat/next-link";
import { useParams } from "@/compat/next-navigation";
import MentionedContent from "@/components/mentions/MentionedContent";
import Editor from "@/components/editor";
import CommentCard from "@/components/posts/CommentCard";
import LikeButton from "@/components/posts/LikeButton";
import PostReactions from "@/components/posts/PostReactions";
import TagLabel from "@/components/tags/TagLabel";
import ThemedProse from "@/components/themed-prose";
import { stripHtmlForMetadata, usePageMetadata } from "@/hooks/usePageMetadata";
import { usePost, usePosts, useSelf, useTags } from "@/hooks/queries";
import { Avatar, Button, Spinner, Text, addToast } from "bioloom-ui";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import ShareNewsPost from "./ShareNewsPost";
import {
  isNewsPost,
  isNewsTag,
  newsCommentCount,
  newsExcerpt,
  newsPostPath,
  newsReadingTime,
  newsTagLabel,
  newsTagRules,
  normalizeNewsTag,
} from "./news";
import { useTheme } from "@/providers/useSiteTheme";
import NewsSurface from "./NewsSurface";
import { useEffect, useMemo, useState } from "react";
import { isGameReleaseFeedItem, type PostType } from "@/types/PostType";
import { hasCookie } from "@/helpers/cookie";
import { postComment } from "@/requests/comment";

export default function NewsArticle() {
  const { colors, siteTheme } = useTheme();
  const backgroundTextColor =
    siteTheme.type === "Light" ? colors["textLight"] : colors["text"];
  const { slug = "" } = useParams();
  const { data: user } = useSelf();
  const { data: post, isLoading, isError } = usePost(String(slug), user?.slug);
  const { data: tags } = useTags();
  const tagRules = useMemo(() => newsTagRules(tags), [tags]);
  const hasNewsTags = Boolean(tagRules && Object.keys(tagRules).length > 0);
  const {
    data: newsItems,
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
  const newsPosts = useMemo(
    () =>
      (newsItems ?? []).filter(
        (item): item is PostType => !isGameReleaseFeedItem(item),
      ),
    [newsItems],
  );
  const currentIndex = newsPosts.findIndex((item) => item.slug === post?.slug);
  const newerPost = currentIndex > 0 ? newsPosts[currentIndex - 1] : undefined;
  const olderPost = currentIndex >= 0 ? newsPosts[currentIndex + 1] : undefined;
  const relatedNews = useMemo(() => {
    if (!post) return [];
    const currentTags = new Set(
      post.tags.filter(isNewsTag).map((tag) => normalizeNewsTag(tag.name)),
    );
    return newsPosts
      .filter(
        (item) =>
          item.id !== post.id &&
          item.id !== newerPost?.id &&
          item.id !== olderPost?.id,
      )
      .sort((a, b) => {
        const aMatches = a.tags.some((tag) => currentTags.has(normalizeNewsTag(tag.name))) ? 1 : 0;
        const bMatches = b.tags.some((tag) => currentTags.has(normalizeNewsTag(tag.name))) ? 1 : 0;
        return bMatches - aMatches;
      })
      .slice(0, 3);
  }, [newsPosts, newerPost?.id, olderPost?.id, post]);
  const [commentContent, setCommentContent] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const isNews = Boolean(post && isNewsPost(post));

  useEffect(() => {
    if (
      post &&
      currentIndex === -1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [currentIndex, fetchNextPage, hasNextPage, isFetchingNextPage, post]);

  usePageMetadata({
    title: isNews ? post?.title : "News",
    description: isNews
      ? stripHtmlForMetadata(post?.content)
      : "Official Down2Jam news, announcements, and site updates.",
    image: isNews ? `/og/news/${encodeURIComponent(post?.slug ?? String(slug))}.png` : "/images/D2J_Icon.png",
    icon: isNews ? post?.author.profilePicture : "/images/D2J_Icon.svg",
    canonical: isNews && post ? newsPostPath(post.slug) : `/news/${slug}`,
    type: isNews ? "article" : "website",
    publishedTime: isNews ? post?.createdAt : undefined,
    modifiedTime: isNews ? post?.editedAt : undefined,
    author: isNews ? post?.author.name : undefined,
    feed: "/news/rss.xml",
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }

  if (isError || !post || !isNews) {
    return (
      <NewsSurface>
        <Text size="2xl">This news article is unavailable.</Text>
        {post && (
          <Button className="mt-4" href={`/p/${post.slug}`}>
            View the forum post
          </Button>
        )}
      </NewsSurface>
    );
  }

  const newsTags = post.tags.filter(isNewsTag);
  const commentCount = newsCommentCount(post.comments);
  const publishedAt = new Date(post.createdAt);
  const latestAt = new Date(post.editedAt ?? post.createdAt);
  const wasEdited = Boolean(post.editedAt);
  const readingMinutes = newsReadingTime(post.content);

  return (
    <NewsSurface card={false}>
      <Button
        href="/news"
        className="mb-4"
        variant="ghost"
        size="sm"
        leftSlot={<ArrowLeft aria-hidden="true" size={16} />}
        style={{ color: backgroundTextColor }}
      >
        All news
      </Button>
      <article
        className="post-card-shell px-5 py-6 sm:px-12 sm:py-12"
        style={{
          backgroundColor: `color-mix(in srgb, ${colors["mantle"]} 98%, transparent)`,
          borderColor: `color-mix(in srgb, ${colors["text"]} 5%, transparent)`,
        }}
      >
        <header
          className="border-b pb-8"
          style={{ borderColor: colors["base"] }}
        >
          <div
            className="flex flex-wrap items-center gap-3 text-sm"
            style={{ color: colors["textFaded"] }}
          >
          {newsTags.map((tag) => (
            <TagLabel key={tag.id} name={tag.name} label={newsTagLabel(tag.name)} />
          ))}
        </div>
          <h1
            className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl"
            style={{ color: colors["text"] }}
          >
            {post.title}
          </h1>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href={`/u/${post.author.slug}`} className="flex items-center gap-2">
            <Avatar size={32} src={post.author.profilePicture} />
            <span>
              <span className="block leading-tight">{post.author.name}</span>
              <span
                className="mt-1 flex items-center gap-2 text-xs"
                style={{ color: colors["textFaded"] }}
              >
                <time
                  dateTime={latestAt.toISOString()}
                  title={
                    wasEdited
                      ? `Published ${format(publishedAt, "MMMM d, yyyy")}`
                      : undefined
                  }
                >
                  {format(latestAt, "MMMM d, yyyy")}
                </time>
                <span aria-hidden="true" className="opacity-50">·</span>
                <span>{readingMinutes} min read</span>
              </span>
            </span>
          </Link>
        </div>
        </header>

        <ThemedProse className="mx-auto py-8 text-[1.0625rem] leading-relaxed">
          <MentionedContent html={post.content} className="break-words" />
        </ThemedProse>

        <footer
          className="flex flex-wrap items-center gap-2 border-t pt-6"
          style={{ borderColor: colors["base"], color: colors["text"] }}
        >
        <LikeButton
          likes={post.likes.length}
          liked={post.hasLiked}
          parentId={post.id}
        />
        <PostReactions
          postId={post.id}
          reactions={post.reactions}
          pickerPosition="top"
        />
        <Button
          href="#news-comments"
          className="post-action-button min-w-12"
          variant="ghost"
          size="sm"
          leftSlot={<MessageCircle aria-hidden="true" size={16} />}
        >
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </Button>
        <div className="ml-auto">
          <ShareNewsPost slug={post.slug} />
        </div>
        </footer>
      </article>

        {(olderPost || newerPost) && (
          <nav
            aria-label="News article navigation"
            className="mt-6 grid gap-3 sm:grid-cols-2"
            style={{ color: colors["text"] }}
          >
            <div>
              {olderPost && (
                <Link
                  href={newsPostPath(olderPost.slug)}
                  className="flex h-full items-start gap-3 rounded-md p-3 hover:underline"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${colors["mantle"]} 98%, transparent)`,
                  }}
                >
                  <ArrowLeft className="mt-1 shrink-0" size={16} />
                  <span>
                    <span className="block text-xs" style={{ color: colors["textFaded"] }}>
                      Previous article
                    </span>
                    <span className="font-medium">{olderPost.title}</span>
                  </span>
                </Link>
              )}
            </div>
            <div>
              {newerPost && (
                <Link
                  href={newsPostPath(newerPost.slug)}
                  className="flex h-full items-start justify-end gap-3 rounded-md p-3 text-right hover:underline"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${colors["mantle"]} 98%, transparent)`,
                  }}
                >
                  <span>
                    <span className="block text-xs" style={{ color: colors["textFaded"] }}>
                      Next article
                    </span>
                    <span className="font-medium">{newerPost.title}</span>
                  </span>
                  <ArrowRight className="mt-1 shrink-0" size={16} />
                </Link>
              )}
            </div>
          </nav>
        )}

        {relatedNews.length > 0 && (
          <section
            className="mt-10"
            aria-labelledby="related-news-title"
            style={{ color: backgroundTextColor }}
          >
            <h2 id="related-news-title" className="text-2xl font-semibold">
              Related news
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  href={newsPostPath(item.slug)}
                  className="rounded-md p-4 hover:underline"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${colors["mantle"]} 98%, transparent)`,
                    color: colors["text"],
                  }}
                >
                  <time
                    className="text-xs"
                    style={{ color: colors["textFaded"] }}
                    dateTime={new Date(item.createdAt).toISOString()}
                  >
                    {format(new Date(item.createdAt), "MMMM d, yyyy")}
                  </time>
                  <h3 className="mt-2 font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-2 text-sm" style={{ color: colors["textFaded"] }}>
                    {newsExcerpt(item.content, 120)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section
          id="news-comments"
          className="mt-10 pt-2"
          aria-labelledby="news-comments-title"
          style={{ color: backgroundTextColor }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="news-comments-title" className="text-2xl font-semibold">
              Discussion
            </h2>
            <span className="text-sm">
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
          </div>

          {hasCookie("token") ? (
            <div className="mt-5">
              <Editor
                content={commentContent}
                setContent={setCommentContent}
                format="markdown"
              />
              <Button
                className="mt-2"
                color="blue"
                loading={postingComment}
                onClick={async () => {
                  if (!commentContent.trim()) {
                    addToast({ title: "Please enter valid content" });
                    return;
                  }
                  setPostingComment(true);
                  const response = await postComment(commentContent, post.id);
                  if (response.ok) {
                    addToast({ title: "Comment posted" });
                    window.location.reload();
                    return;
                  }
                  addToast({ title: "Could not post comment" });
                  setPostingComment(false);
                }}
              >
                Post comment
              </Button>
            </div>
          ) : (
            <Button className="mt-5" href="/login" variant="ghost">
              Log in to join the discussion
            </Button>
          )}

          <div className="mt-8 flex flex-col gap-3">
            {post.comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} user={user} />
            ))}
          </div>
        </section>
    </NewsSurface>
  );
}
