type Track = { slug: string };

export function getPageSoundtrack<T extends Track>(
  jamTracks: T[],
  pageTracks: T[],
  version: "JAM" | "POST_JAM",
) {
  if (version === "JAM") {
    return pageTracks.map((track) => ({ ...track, pageVersion: "JAM" as const }));
  }
  const replacements = new Map(pageTracks.map((track) => [track.slug, track]));
  const originalSlugs = new Set(jamTracks.map((track) => track.slug));
  return [
    ...jamTracks.map((track) => {
      const replacement = replacements.get(track.slug);
      return replacement
        ? { ...replacement, pageVersion: "POST_JAM" as const }
        : { ...track, pageVersion: "JAM" as const };
    }),
    ...pageTracks.filter((track) => !originalSlugs.has(track.slug))
      .map((track) => ({ ...track, pageVersion: "POST_JAM" as const })),
  ];
}
