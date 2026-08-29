type SortableEmoji = {
  slug: string;
  popularityScore?: number;
};

export function sortEmojisByUsage<T extends SortableEmoji>(
  emojis: T[],
  personalUseCounts: Record<string, number> = {},
) {
  return [...emojis].sort((a, b) => {
    const personalDelta =
      (personalUseCounts[b.slug] ?? 0) - (personalUseCounts[a.slug] ?? 0);
    if (personalDelta !== 0) return personalDelta;

    const popularityDelta =
      (b.popularityScore ?? 0) - (a.popularityScore ?? 0);
    if (popularityDelta !== 0) return popularityDelta;

    return a.slug.localeCompare(b.slug);
  });
}
