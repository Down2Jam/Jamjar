import Link from "@/compat/next-link";
import type { PostType } from "@/types/PostType";
import { Avatar, Button } from "bioloom-ui";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import TagLabel from "@/components/tags/TagLabel";
import LikeButton from "@/components/posts/LikeButton";
import PostReactions from "@/components/posts/PostReactions";
import ShareNewsPost from "./ShareNewsPost";
import {
  isNewsTag,
  newsCommentCount,
  newsExcerpt,
  newsPostPath,
  newsReadingTime,
  newsTagLabel,
} from "./news";
import { useTheme } from "@/providers/useSiteTheme";
import { useState, type CSSProperties } from "react";

export default function NewsArticlePreview({
  post,
  featured = false,
}: {
  post: PostType;
  featured?: boolean;
}) {
  const { colors } = useTheme();
  const [previewImageUnavailable, setPreviewImageUnavailable] = useState(false);
  const excerpt = newsExcerpt(post.content);
  const newsTags = post.tags.filter(isNewsTag);
  const commentCount = newsCommentCount(post.comments);
  const publishedAt = new Date(post.createdAt);
  const latestAt = new Date(post.editedAt ?? post.createdAt);
  const wasEdited = Boolean(post.editedAt);
  const readingMinutes = newsReadingTime(post.content);

  return (
    <article
      className={`post-card-shell overflow-visible border ${
        featured && !previewImageUnavailable
          ? "grid lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]"
          : featured
            ? "block"
            : "flex h-full flex-col p-5"
      }`}
      style={{
        borderColor: `color-mix(in srgb, ${colors["text"]} 5%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${colors["mantle"]} 98%, transparent)`,
        color: colors["text"],
        "--post-card-border": `color-mix(in srgb, ${colors["text"]} 5%, transparent)`,
        "--post-card-shadow": `color-mix(in srgb, ${colors["crust"]} 68%, transparent)`,
        "--post-action-surface": `color-mix(in srgb, ${colors["mantle"]} 70%, ${colors["crust"]})`,
        "--post-action-hover": colors["base"],
      } as CSSProperties}
    >
      <div className={featured ? "p-6 sm:p-8 lg:p-10" : "contents"}>
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
        style={{ color: colors["textFaded"] }}
      >
        {featured && (
          <span className="font-semibold uppercase tracking-wider" style={{ color: colors["red"] }}>
            Latest
          </span>
        )}
        {newsTags.map((tag) => (
          <TagLabel key={tag.id} name={tag.name} label={newsTagLabel(tag.name)} />
        ))}
      </div>

      <Link href={newsPostPath(post.slug)} className="group mt-3 block">
        <h2
          className={`${featured ? "text-3xl sm:text-5xl" : "text-[1.375rem]"} font-semibold leading-tight group-hover:underline`}
          style={{ color: colors["text"] }}
        >
          {post.title}
        </h2>
      </Link>

      {excerpt && (
        <p
          className="mt-3 max-w-[72ch] text-base leading-relaxed"
          style={{ color: colors["textFaded"] }}
        >
          {excerpt}
        </p>
      )}

      <div
        className={`${featured ? "mt-7" : "mt-auto pt-5"} flex flex-wrap items-center gap-3 text-sm`}
        style={{ color: colors["textFaded"] }}
      >
        <Link href={`/u/${post.author.slug}`} className="flex items-center gap-2">
          <Avatar size={24} src={post.author.profilePicture} />
          <span>
            <span className="block leading-tight">{post.author.name}</span>
            <span className="mt-0.5 flex items-center gap-2 text-xs">
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
        <LikeButton
          likes={post.likes.length}
          liked={post.hasLiked}
          parentId={post.id}
        />
        <Link href={`${newsPostPath(post.slug)}#news-comments`}>
          <Button
            className="post-action-button min-w-12"
            variant="ghost"
            size="sm"
            leftSlot={<MessageCircle aria-hidden="true" size={16} />}
          >
            {commentCount}
          </Button>
        </Link>
        <PostReactions
          postId={post.id}
          reactions={post.reactions}
          pickerPosition="top"
        />
        <div className="ml-auto">
          <ShareNewsPost slug={post.slug} />
        </div>
      </div>
      </div>
      {featured && !previewImageUnavailable && (
        <Link
          href={newsPostPath(post.slug)}
          className="min-h-56 overflow-hidden rounded-b-md lg:min-h-full lg:rounded-b-none lg:rounded-r-md"
          aria-label={`Read ${post.title}`}
        >
          <img
            src={`/og/news/${encodeURIComponent(post.slug)}.png`}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setPreviewImageUnavailable(true)}
          />
        </Link>
      )}
    </article>
  );
}
