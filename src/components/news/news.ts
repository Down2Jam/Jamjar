import type { PostType } from "@/types/PostType";
import type { TagType } from "@/types/TagType";
import type { CommentType } from "@/types/CommentType";

export const NEWS_TAG_NAMES = new Set(["siteannouncement", "sitechangelog"]);
export const NEWS_READ_STORAGE_KEY = "d2jam-news-last-read";
export const NEWS_READ_EVENT = "d2jam-news-read";

export function normalizeNewsTag(name: string) {
  return name.toLowerCase().replace(/[\s_-]+/g, "");
}

export function isNewsTag(tag: Pick<TagType, "name">) {
  return NEWS_TAG_NAMES.has(normalizeNewsTag(tag.name));
}

export function isNewsPost(post: Pick<PostType, "tags">) {
  return post.tags.some(isNewsTag);
}

export function newsTagLabel(name: string) {
  return normalizeNewsTag(name) === "siteannouncement"
    ? "Announcement"
    : "Changelog";
}

export function newsTagRules(tags?: TagType[]) {
  if (!tags) return undefined;

  return Object.fromEntries(
    tags.filter(isNewsTag).map((tag) => [tag.id, 1]),
  ) as Record<number, number>;
}

function decodeExcerptEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
    const hex = code[1]?.toLowerCase() === "x";
    const parsed = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
    return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
  });
}

export function newsExcerpt(content: string, maxLength = 280) {
  const withoutUnsafeBlocks = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  const firstParagraph = withoutUnsafeBlocks.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const text = decodeExcerptEntities(firstParagraph ?? withoutUnsafeBlocks)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > maxLength * 0.7 ? lastSpace : undefined).trim()}…`;
}

export function newsReadingTime(content: string) {
  const text = decodeExcerptEntities(content)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;

  return Math.max(1, Math.ceil(words / 200));
}

export function markNewsRead() {
  if (typeof window === "undefined") return;
  localStorage.setItem(NEWS_READ_STORAGE_KEY, new Date().toISOString());
  window.dispatchEvent(new Event(NEWS_READ_EVENT));
}

export function newsPostPath(slug: string) {
  return `/news/${encodeURIComponent(slug)}`;
}

export function newsCommentCount(comments: CommentType[]): number {
  return comments.reduce(
    (total, comment) => total + 1 + newsCommentCount(comment.children ?? []),
    0,
  );
}

export function newsShareUrls(title: string, url: string) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${title} ${url}`);

  return {
    bluesky: `https://bsky.app/intent/compose?text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
}
