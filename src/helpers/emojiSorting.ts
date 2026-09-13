type SortableEmoji = {
  slug: string;
  popularityScore?: number;
  createdAt?: string | Date;
};

const USAGE_PRIORITY_COUNT = 18;

function compareByUsage(
  a: SortableEmoji,
  b: SortableEmoji,
  personalUseCounts: Record<string, number>,
) {
  const personalDelta =
    (personalUseCounts[b.slug] ?? 0) - (personalUseCounts[a.slug] ?? 0);
  if (personalDelta !== 0) return personalDelta;

  const popularityDelta =
    (b.popularityScore ?? 0) - (a.popularityScore ?? 0);
  if (popularityDelta !== 0) return popularityDelta;

  return a.slug.localeCompare(b.slug);
}

function uploadTime(emoji: SortableEmoji) {
  if (!emoji.createdAt) return 0;
  const time = new Date(emoji.createdAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortEmojisByUsage<T extends SortableEmoji>(
  emojis: T[],
  personalUseCounts: Record<string, number> = {},
  priorityEmotes: SortableEmoji[] = [],
) {
  const prioritySlugs = new Set(priorityEmotes.map((emoji) => emoji.slug));
  const priorityEmojis = emojis.filter((emoji) => prioritySlugs.has(emoji.slug));
  const remainingEmojis = emojis.filter((emoji) => !prioritySlugs.has(emoji.slug));
  const usageSorted = [...remainingEmojis].sort((a, b) =>
    compareByUsage(a, b, personalUseCounts),
  );
  const usagePriority = usageSorted.slice(0, USAGE_PRIORITY_COUNT);
  const usagePrioritySlugs = new Set(usagePriority.map((emoji) => emoji.slug));
  const newestRemaining = remainingEmojis
    .filter((emoji) => !usagePrioritySlugs.has(emoji.slug))
    .sort((a, b) => uploadTime(b) - uploadTime(a) || a.slug.localeCompare(b.slug));

  return [...priorityEmojis, ...usagePriority, ...newestRemaining];
}
