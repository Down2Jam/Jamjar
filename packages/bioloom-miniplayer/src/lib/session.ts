import type { TrackType } from "../context/MusicContext";

export type PlayerSession = {
  playbackScope: string | null;
  temporaryAutoplay: boolean;
  tracks: TrackType[];
  manual: (TrackType | null)[];
  anchor: number | null;
  current: number | null;
  external: TrackType | null;
  queue: number[];
  back: number[];
  removed: number[];
  time: number;
  shown: boolean;
};

// Store only playback data, not the full game/user responses attached to tracks.
export function sessionTrack(track: TrackType): TrackType {
  const {
    id,
    slug,
    url,
    name,
    pageVersion,
    loudnessGainDb,
    bpm,
    tags,
    allowDownload,
    license,
    allowBackgroundUse,
    allowBackgroundUseAttribution,
  } = track;
  const composer = track.composer ?? {};
  const game = track.game ?? {};
  return {
    id,
    slug,
    url,
    name,
    pageVersion,
    loudnessGainDb,
    bpm,
    tags,
    allowDownload,
    license,
    allowBackgroundUse,
    allowBackgroundUseAttribution,
    composer: {
      id: composer.id,
      slug: composer.slug,
      name: composer.name,
      profilePicture: composer.profilePicture,
    },
    game: {
      id: game.id,
      slug: game.slug,
      name: game.name,
      thumbnail: game.thumbnail,
      soundtrackThumbnail: game.soundtrackThumbnail,
      jamId: game.jamId,
      category: game.category,
      team: game.team,
    },
  };
}

export function parseSession(raw: string | null): PlayerSession | null {
  try {
    if (!raw || raw.length > 4_000_000) return null;
    const value = JSON.parse(raw);
    const validTrack = (track: TrackType) =>
      track &&
      typeof track.name === "string" &&
      typeof track.url === "string" &&
      /^(https?:\/\/|\/[^/])/.test(track.url) &&
      track.composer &&
      track.game;
    if (!Array.isArray(value.tracks) || !value.tracks.every(validTrack))
      return null;
    const manual =
      Array.isArray(value.manual) &&
      value.manual.every(
        (track: TrackType | null) => track === null || validTrack(track),
      )
        ? value.manual.map((track: TrackType | null) =>
            track ? sessionTrack(track) : null,
          )
        : [];
    const validIndex = (index: number) =>
      Number.isInteger(index) &&
      (index >= 0 ? index < value.tracks.length : Boolean(manual[-index - 1]));
    if (value.current !== null && !validIndex(value.current)) return null;
    if (value.external !== null && !validTrack(value.external)) return null;
    const indices = (items: unknown, limit: number) =>
      Array.isArray(items) ? items.filter(validIndex).slice(0, limit) : [];
    return {
      playbackScope:
        typeof value.playbackScope === "string" ? value.playbackScope : null,
      temporaryAutoplay:
        typeof value.playbackScope === "string" &&
        value.temporaryAutoplay === true,
      manual,
      anchor:
        Number.isInteger(value.anchor) &&
        value.anchor >= 0 &&
        value.anchor < value.tracks.length
          ? value.anchor
          : null,
      tracks: value.tracks.map(sessionTrack),
      current: value.current,
      external: value.external ? sessionTrack(value.external) : null,
      queue: [...new Set(indices(value.queue, 1000))],
      back: indices(value.back, 100),
      removed: indices(value.removed, value.tracks.length),
      time: Number.isFinite(value.time) ? Math.max(0, value.time) : 0,
      shown: value.shown === true,
    };
  } catch {
    return null;
  }
}

export function restoreSession(raw: string | null, position: string | null) {
  const session = parseSession(raw);
  if (!session || !position || typeof window === "undefined") return session;
  try {
    const saved = JSON.parse(position);
    const track =
      session.current == null
        ? session.external
        : session.current < 0
          ? session.manual[-session.current - 1]
          : session.tracks[session.current];
    if (
      track &&
      saved.source === new URL(track.url, window.location.href).href &&
      Number.isFinite(saved.time) &&
      saved.time >= 0
    )
      session.time = saved.time;
  } catch {
    /* Keep the legacy session time if the position entry is invalid. */
  }
  return session;
}
