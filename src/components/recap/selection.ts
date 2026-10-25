import type { JamType } from "@/types/JamType";

export function pickRecapJamId(
  jamParam: string | null,
  jams: Pick<JamType, "id" | "slug" | "startTime" | "jammingHours" | "submissionHours" | "ratingHours">[],
  currentJamId?: number | null,
  now = Date.now(),
) {
  const requestedJam = jamParam
    ? jams.find((jam) => jam.slug === jamParam || String(jam.id) === jamParam)
    : undefined;

  const latestRatedJam = jams
    .filter((jam) => {
      const ratingEnd = new Date(jam.startTime).getTime()
        + (jam.jammingHours + jam.submissionHours + jam.ratingHours) * 60 * 60 * 1000;
      return ratingEnd <= now;
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

  return requestedJam?.id
    ?? latestRatedJam?.id
    ?? jams.find((jam) => jam.id === currentJamId)?.id
    ?? jams[0]?.id
    ?? null;
}
