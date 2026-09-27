import type { JamType } from "@/types/JamType";

export function pickRecapJamId(
  jamParam: string | null,
  jams: Pick<JamType, "id" | "slug">[],
  currentJamId?: number | null,
) {
  const requestedJam = jamParam
    ? jams.find((jam) => jam.slug === jamParam || String(jam.id) === jamParam)
    : undefined;
  return requestedJam?.id
    ?? jams.find((jam) => jam.id === currentJamId)?.id
    ?? jams[0]?.id
    ?? null;
}
