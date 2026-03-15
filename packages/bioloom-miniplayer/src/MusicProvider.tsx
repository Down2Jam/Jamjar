"use client";

import { getCurrentJam } from "@/helpers/jam";
import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { useEffectiveHideRatings } from "@/hooks/useEffectiveHideRatings";
import { postTrackRating } from "@/requests/rating";
import { getTrackRatingCategories } from "@/requests/track";
import { getSelf } from "@/requests/user";
import {
  emitTrackRatingSync,
  subscribeToTrackRatingSync,
  upsertTrackRatingRecord,
} from "@/helpers/trackRatingSync";
import {
  addToast,
  Button,
  Icon,
  Popover,
  Text,
  Hstack,
  Vstack,
} from "bioloom-ui";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "bioloom-ui";
import { Star } from "lucide-react";

export type TrackComposer = {
  name?: string;
  slug?: string;
};

export type TrackGame = {
  id?: number;
  jamId?: number;
  name?: string;
  thumbnail?: string;
  slug?: string;
  team?: {
    users?: Array<{
      id: number;
    }>;
  };
};

export type TrackType = {
  id?: number;
  slug?: string;
  url: string;
  name: string;
  composer: TrackComposer;
  game: TrackGame;
};

export type PlayableTrack = {
  id?: number;
  slug?: string;
  name: string;
  artist: TrackComposer;
  thumbnail: string;
  game: TrackGame;
  song: string;
};

type MusicContextValue = {
  audioEl: HTMLAudioElement | null;
  analyser: AnalyserNode | null;
  currentIndex: number | null;
  current: PlayableTrack | null;
  isPlaying: boolean;
  toggle: () => void;
  volume: number;
  playItem: (t: PlayableTrack) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  canPrev: boolean;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  tracks: TrackType[];
  setTracks: (tracks: TrackType[]) => void;
  repeatState: "none" | "repeat" | "autoplay";
  toggleRepeatState: () => void;
  stop: () => void;
  shown: boolean;
  setShown: (val: boolean) => void;
};

const storageKey = {
  volume: "music_volume",
  repeat: "music_repeat",
  minimized: "music_minimized",
  corner: "music_corner",
} as const;

const readStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useState<number>(() => {
    const v = parseFloat(readStorage(storageKey.volume) ?? "");
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : 0.5;
  });
  const [repeatState, setRepeatState] = useState<
    "none" | "repeat" | "autoplay"
  >(() => {
    const v = (readStorage(storageKey.repeat) ?? "") as string;
    return v === "repeat" || v === "autoplay" || v === "none" ? v : "repeat";
  });
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const nextRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const [backStack, setBackStack] = useState<number[]>([]);
  const [fwdStack, setFwdStack] = useState<number[]>([]);
  const repeatStateRef = useRef(repeatState);
  const [shown, setShown] = useState<boolean>(false);
  const [music, setMusic] = useState<TrackType[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserState, setAnalyserState] = useState<AnalyserNode | null>(null);

  const ensureAudioContext = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audioCtxRef.current) {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = new AudioContextCtor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setAnalyserState(analyser);
      return;
    }

    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }
  }, []);

  const playIndex = useCallback(
    async (i: number) => {
      if (!audioRef.current || !music[i]) return;
      ensureAudioContext();
      const audio = audioRef.current;
      const track = music[i];
      const src = track.url;
      if (audio.src !== src) audio.src = src;
      audio.volume = volume;
      setCurrentIndex(i);
      await audio.play();

      setShown(true);
    },
    [volume, music, ensureAudioContext],
  );

  useEffect(() => {
    writeStorage(storageKey.volume, String(volume));
  }, [volume]);

  useEffect(() => {
    repeatStateRef.current = repeatState;
    writeStorage(storageKey.repeat, repeatState);
  }, [repeatState]);

  const next = useCallback(async () => {
    if (fwdStack.length > 0) {
      setFwdStack((fs) => {
        const nextIdx = fs[fs.length - 1];
        if (currentIndex != null) {
          setBackStack((bs) =>
            bs[bs.length - 1] === currentIndex ? bs : [...bs, currentIndex],
          );
        }
        setTimeout(() => void playIndex(nextIdx), 0);
        return fs.slice(0, -1);
      });
      return;
    }

    if (!music.length) return;
    const cur = currentIndex ?? -1;
    let nextIdx = 0;
    if (music.length > 1) {
      do nextIdx = Math.floor(Math.random() * music.length);
      while (nextIdx === cur);
    }

    if (currentIndex != null) {
      setBackStack((bs) =>
        bs[bs.length - 1] === currentIndex ? bs : [...bs, currentIndex],
      );
    }
    setFwdStack([]);
    await playIndex(nextIdx);
  }, [currentIndex, fwdStack.length, playIndex, music.length]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const seek = useCallback(
    (t: number) => {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = Math.min(Math.max(0, t), duration || 0);
    },
    [duration],
  );

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => {
      if (repeatStateRef.current === "autoplay") {
        nextRef.current?.();
      } else if (repeatStateRef.current === "repeat" && audioRef.current) {
        audioRef.current.play();
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const setVolume = useCallback((v: number) => {
    const nv = Math.min(Math.max(0, v), 1);
    setVol(nv);
    if (audioRef.current) audioRef.current.volume = nv;
  }, []);

  const prev = useCallback(async () => {
    setBackStack((bs) => {
      if (bs.length === 0) return bs;
      const target = bs[bs.length - 1];

      setFwdStack((fs) =>
        currentIndex == null || fs[fs.length - 1] === currentIndex
          ? fs
          : [...fs, currentIndex],
      );

      setTimeout(() => void playIndex(target), 0);
      return bs.slice(0, -1);
    });
  }, [currentIndex, playIndex]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      ensureAudioContext();
      a.play();
    } else a.pause();
  };

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
  }, []);

  const toggleRepeatState = useCallback(() => {
    switch (repeatState) {
      case "autoplay":
        setRepeatState("repeat");
        return;
      case "repeat":
        setRepeatState("none");
        return;
      case "none":
        setRepeatState("autoplay");
        return;
    }
  }, [repeatState]);

  const current = currentIndex == null ? null : music[currentIndex];

  const playItem = useCallback(
    async (t: PlayableTrack) => {
      const i = music.findIndex((x) => x.url === t.song);
      if (i >= 0) {
        setBackStack((bs) =>
          currentIndex == null || bs[bs.length - 1] === currentIndex
            ? bs
            : [...bs, currentIndex],
        );
        setFwdStack([]);
        await playIndex(i);
        return;
      }
      if (!audioRef.current) return;
      ensureAudioContext();
      const audio = audioRef.current;
      audio.src = t.song;
      audio.volume = volume;
      setBackStack((bs) =>
        currentIndex == null || bs[bs.length - 1] === currentIndex
          ? bs
          : [...bs, currentIndex],
      );
      setFwdStack([]);
      setCurrentIndex(null);
      await audio.play();
    },
    [currentIndex, playIndex, volume, music, ensureAudioContext],
  );

  const value = useMemo(
    () => ({
      audioEl: audioRef.current,
      analyser: analyserState,
      current,
      isPlaying,
      volume,
      currentIndex,
      playItem,
      toggle,
      next,
      prev,
      canPrev: backStack.length >= 1,
      seek,
      setVolume,
      tracks: music,
      setTracks: setMusic,
      toggleRepeatState,
      repeatState,
      stop,
      shown,
      setShown,
    }),
    [
      audioRef,
      analyserState,
      playItem,
      current,
      isPlaying,
      volume,
      currentIndex,
      next,
      prev,
      seek,
      setVolume,
      music,
      backStack.length,
      toggleRepeatState,
      repeatState,
      stop,
      shown,
    ],
  );

  return (
    <MusicContext.Provider
      value={{
        ...value,
        current: {
          id: value.current?.id,
          slug: value.current?.slug,
          song: value.current?.url || "",
          name: value.current?.name || "",
          artist: value.current?.composer || {},
          thumbnail: value.current?.game.thumbnail || "",
          game: value.current?.game || {},
        },
      }}
    >
      {children}
      <MiniPlayer />
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}

function MiniPlayer() {
  const {
    current,
    isPlaying,
    toggle,
    seek,
    volume,
    setVolume,
    next,
    prev,
    canPrev,
    audioEl,
    analyser,
    repeatState,
    toggleRepeatState,
    stop,
    shown,
    setShown,
  } = useMusic();
  const [progress, setProgress] = useState({ time: 0, duration: 0 });
  const { colors } = useTheme();
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingCategoryId, setRatingCategoryId] = useState<number | null>(null);
  const [viewerId, setViewerId] = useState<number | null>(null);
  const [viewerTeamGameIds, setViewerTeamGameIds] = useState<number[]>([]);
  const [viewerTrackRatings, setViewerTrackRatings] = useState<
    Array<{ trackId: number; categoryId: number; value: number }>
  >([]);
  const [activeJamId, setActiveJamId] = useState<number | null>(null);
  const [activeJamPhase, setActiveJamPhase] = useState<string | null>(null);
  const [savingRating, setSavingRating] = useState(false);
  const [hideRatings, setHideRatings] = useState(false);
  const [autoHideRatingsWhileStreaming, setAutoHideRatingsWhileStreaming] =
    useState(false);
  const [viewerTwitch, setViewerTwitch] = useState<string | null>(null);
  const [minimized, setMinimized] = useState<boolean>(() => {
    const stored = readStorage(storageKey.minimized);
    if (stored === "true") return true;
    if (stored === "false") return false;
    return true;
  });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number }>();
  const [transformOrigin, setTransformOrigin] = useState<string>("bottom left");
  type AnchorCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
  const initialCorner =
    (readStorage(storageKey.corner) as AnchorCorner | null) ?? "bottom-left";
  const anchorCornerRef = useRef<AnchorCorner>(initialCorner);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ offsetX: number; offsetY: number }>({
    offsetX: 0,
    offsetY: 0,
  });
  const hasSpawnedRef = useRef(false);
  const effectiveHideRatings = useEffectiveHideRatings({
    hideRatings,
    autoHideRatingsWhileStreaming,
    twitch: viewerTwitch ?? undefined,
  });

  const marginLeftTop = 16;
  const marginRightBottom = 38;
  const snapDistance = 120;

  const setAnchorCornerRef = (corner: AnchorCorner) => {
    anchorCornerRef.current = corner;
    writeStorage(storageKey.corner, corner);
  };

  const computeSnapPosition = (corner: AnchorCorner) => {
    if (!dragRef.current) return { left: marginLeftTop, top: marginLeftTop };
    const rectWidth = dragRef.current.offsetWidth;
    const rectHeight = dragRef.current.offsetHeight;
    const maxLeft = Math.max(
      marginLeftTop,
      window.innerWidth - rectWidth - marginRightBottom,
    );
    const maxTop = Math.max(
      marginLeftTop,
      window.innerHeight - rectHeight - marginRightBottom,
    );

    switch (corner) {
      case "top-left":
        return { left: marginLeftTop, top: marginLeftTop };
      case "top-right":
        return { left: maxLeft, top: marginLeftTop };
      case "bottom-right":
        return { left: maxLeft, top: maxTop };
      case "bottom-left":
      default:
        return { left: marginLeftTop, top: maxTop };
    }
  };

  useEffect(() => {
    if (!shown || hasSpawnedRef.current) return;
    const corner = anchorCornerRef.current;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!dragRef.current) return;
        setPosition(computeSnapPosition(corner));
        hasSpawnedRef.current = true;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [shown, marginLeftTop, marginRightBottom]);

  useEffect(() => {
    if (!dragRef.current || !position) return;
    const rectWidth = dragRef.current.offsetWidth;
    const rectHeight = dragRef.current.offsetHeight;
    const midX = (window.innerWidth - rectWidth) / 2;
    const midY = (window.innerHeight - rectHeight) / 2;
    const horizontal = position.left <= midX ? "left" : "right";
    const vertical = position.top <= midY ? "top" : "bottom";
    setTransformOrigin(`${vertical} ${horizontal}`);
    setAnchorCornerRef(`${vertical}-${horizontal}` as AnchorCorner);
  }, [position, minimized]);

  useEffect(() => {
    if (!dragRef.current || !position) return;
    const anchorCorner = anchorCornerRef.current;
    setPosition((prev) => (prev ? computeSnapPosition(anchorCorner) : prev));
  }, [minimized, marginLeftTop, marginRightBottom]);

  useEffect(() => {
    if (!audioEl) return;
    let raf = 0;
    const tick = () => {
      setProgress({
        time: audioEl.currentTime || 0,
        duration: audioEl.duration || 0,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioEl]);

  useEffect(() => {
    if (!position) return;
    const handleResize = () => {
      if (!dragRef.current) return;
      const corner = anchorCornerRef.current;
      setPosition((prev) => (prev ? computeSnapPosition(corner) : prev));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position, marginLeftTop, marginRightBottom]);

  useEffect(() => {
    writeStorage(storageKey.minimized, minimized ? "true" : "false");
  }, [minimized]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [userResponse, jamResponse, categoriesResponse] =
          await Promise.all([
            getSelf().catch(() => null),
            getCurrentJam().catch(() => null),
            getTrackRatingCategories().catch(() => null),
          ]);

        if (cancelled) return;

        if (userResponse?.ok) {
          const user = await userResponse.json();
          if (cancelled) return;
          setViewerId(user?.id ?? null);
          setViewerTeamGameIds(
            Array.isArray(user?.teams)
              ? user.teams
                  .map(
                    (team: { game?: { id?: number } | null }) => team.game?.id,
                  )
                  .filter((id: number | undefined): id is number =>
                    Number.isInteger(id),
                  )
              : [],
          );
          setViewerTrackRatings(
            Array.isArray(user?.trackRatings) ? user.trackRatings : [],
          );
          setHideRatings(Boolean(user?.hideRatings));
          setAutoHideRatingsWhileStreaming(
            Boolean(user?.autoHideRatingsWhileStreaming),
          );
          setViewerTwitch(user?.twitch ?? null);
        } else {
          setViewerId(null);
          setViewerTeamGameIds([]);
          setViewerTrackRatings([]);
          setHideRatings(false);
          setAutoHideRatingsWhileStreaming(false);
          setViewerTwitch(null);
        }

        setActiveJamId(jamResponse?.jam?.id ?? null);
        setActiveJamPhase(jamResponse?.phase ?? null);

        if (categoriesResponse?.ok) {
          const payload = await categoriesResponse.json();
          const overall =
            payload?.data?.find(
              (category: { id: number; name: string }) =>
                category.name === "Overall",
            ) ?? null;
          setRatingCategoryId(overall?.id ?? null);
        } else {
          setRatingCategoryId(null);
        }
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!current?.id || !ratingCategoryId) {
      setSelectedRating(0);
      return;
    }

    setSelectedRating(
      viewerTrackRatings.find(
        (rating) =>
          rating.trackId === current.id &&
          rating.categoryId === ratingCategoryId,
      )?.value ?? 0,
    );
  }, [current?.id, ratingCategoryId, viewerTrackRatings]);

  useEffect(() => {
    return subscribeToTrackRatingSync((payload) => {
      setViewerTrackRatings((prev) => upsertTrackRatingRecord(prev, payload));
    });
  }, []);

  if (!current) return null;

  const isTeamMember = Boolean(
    viewerId &&
    current.game.team?.users?.some((member) => member.id === viewerId),
  );
  const isCurrentJamTrack =
    activeJamId != null &&
    current.game.jamId != null &&
    activeJamId === current.game.jamId;
  const canRateDuringJam =
    Boolean(viewerId) &&
    !isTeamMember &&
    isCurrentJamTrack &&
    (activeJamPhase === "Rating" || activeJamPhase === "Submission");
  const showRating =
    !minimized &&
    !isTeamMember &&
    current.id != null &&
    Boolean(viewerId) &&
    Boolean(ratingCategoryId) &&
    canRateDuringJam;
  const ratingDisabled =
    savingRating || !viewerId || !ratingCategoryId || !canRateDuringJam;
  const displayRating = hoverRating || selectedRating;

  const clampPosition = (left: number, top: number) => {
    if (!dragRef.current) return { left, top };
    const rectWidth = dragRef.current.offsetWidth;
    const rectHeight = dragRef.current.offsetHeight;
    const maxLeft = Math.max(
      marginLeftTop,
      window.innerWidth - rectWidth - marginRightBottom,
    );
    const maxTop = Math.max(
      marginLeftTop,
      window.innerHeight - rectHeight - marginRightBottom,
    );
    return {
      left: Math.min(Math.max(marginLeftTop, left), maxLeft),
      top: Math.min(Math.max(marginLeftTop, top), maxTop),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, input, a, [data-no-drag='true']")) return;
    if (!dragRef.current) return;
    e.preventDefault();
    const rect = dragRef.current.getBoundingClientRect();
    dragState.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    setDragging(true);
    dragRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.preventDefault();
    const nextLeft = e.clientX - dragState.current.offsetX;
    const nextTop = e.clientY - dragState.current.offsetY;
    setPosition(clampPosition(nextLeft, nextTop));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    dragRef.current?.releasePointerCapture(e.pointerId);

    if (!dragRef.current || !position) return;

    const corners: AnchorCorner[] = [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ];

    let best = position;
    let bestDist = Number.POSITIVE_INFINITY;
    let bestCorner: AnchorCorner | null = null;
    for (const corner of corners) {
      const target = computeSnapPosition(corner);
      const dx = position.left - target.left;
      const dy = position.top - target.top;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = target;
        bestCorner = corner;
      }
    }

    if (bestDist <= snapDistance) {
      if (bestCorner) setAnchorCornerRef(bestCorner);
      setPosition(best);
    }
  };

  return (
    <Popover
      position="bottom-left"
      showCloseButton
      disableHoverScale
      closeButtonPosition="top-left"
      onClose={stop}
      startsShown={true}
      shown={shown}
      onShownChange={setShown}
      transformOrigin={transformOrigin}
      positionerStyle={
        position
          ? {
              position: "fixed",
              left: position.left,
              top: position.top,
              zIndex: 50,
              pointerEvents: "none",
            }
          : undefined
      }
    >
      <div
        ref={dragRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          cursor: dragging ? "grabbing" : "grab",
          userSelect: dragging ? "none" : "auto",
        }}
      >
        <Hstack>
          <Vstack align="stretch">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img
                src={current.thumbnail}
                width={minimized ? 28 : 56}
                height={minimized ? 28 : 56}
                style={{ borderRadius: 8, objectFit: "cover" }}
                alt=""
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: minimized ? 12 : 14,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {current.slug ? (
                    <Link href={`/m/${current.slug}`}>{current.name}</Link>
                  ) : (
                    current.name
                  )}
                </div>
                <div
                  style={{
                    fontSize: minimized ? 10 : 12,
                    color: colors["textFaded"],
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {current.game.slug ? (
                    <Link href={`/g/${current.game.slug}`}>
                      {current.game.name ?? ""}
                    </Link>
                  ) : (
                    (current.game.name ?? "")
                  )}{" "}
                  -{" "}
                  {current.artist.slug ? (
                    <Link href={`/u/${current.artist.slug}`}>
                      {current.artist.name || current.artist.slug || ""}
                    </Link>
                  ) : (
                    current.artist.name || current.artist.slug || ""
                  )}
                </div>
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <Button
                  onClick={prev}
                  disabled={!canPrev}
                  size={minimized ? "xs" : "md"}
                >
                  <Icon
                    name="skipback"
                    color={canPrev ? "text" : "textFaded"}
                    size={minimized ? 16 : 24}
                  />
                </Button>
                <Button
                  onClick={() => {
                    toggle();
                    if (!shown) {
                      setShown(true);
                    }
                  }}
                  size={minimized ? "xs" : "md"}
                >
                  <Icon
                    name={isPlaying ? "pause" : "play"}
                    size={minimized ? 16 : 24}
                  />
                </Button>
                <Button onClick={next} size={minimized ? "xs" : "md"}>
                  <Icon name="skipforward" size={minimized ? 16 : 24} />
                </Button>
              </div>
            </div>

            {!minimized && (
              <Hstack>
                <Vstack className="w-full" align="stretch">
                  <input
                    type="range"
                    min={0}
                    max={progress.duration || 0}
                    step={0.01}
                    value={Number.isFinite(progress.time) ? progress.time : 0}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      WebkitAppearance: "none",
                      height: "4px",
                      borderRadius: "4px",
                      background: `linear-gradient(to right, 
      ${colors["blue"]} 0%, 
      ${colors["indigo"]} ${(progress.time / (progress.duration || 1)) * 100}%, 
      ${colors["base"]} ${(progress.time / (progress.duration || 1)) * 100}%, 
      ${colors["base"]} 100%)`,
                      outline: "none",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <Text color="text" size="xs">
                      Volume
                    </Text>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      aria-label="Volume"
                      style={{
                        width: "100%",
                        marginTop: 8,
                        WebkitAppearance: "none",
                        height: "4px",
                        borderRadius: "4px",
                        background: `linear-gradient(to right, 
      ${colors["yellow"]} 0%, 
      ${colors["orange"]} ${(volume / 1) * 100}%, 
      ${colors["base"]} ${(volume / 1) * 100}%, 
      ${colors["base"]} 100%)`,
                        outline: "none",
                      }}
                    />
                  </div>

                  {showRating && (
                    <RatingVisibilityGate
                      hiddenByPreference={effectiveHideRatings}
                      hiddenText="Ratings are hidden by your settings."
                      buttonSize="xs"
                    >
                      <div
                        data-no-drag="true"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        <Text color="text" size="xs">
                          Rate
                        </Text>
                        <div
                          data-no-drag="true"
                          style={{ display: "flex", gap: 4 }}
                        >
                          {[2, 4, 6, 8, 10].map((value) => (
                            <div
                              key={`mini-player-rating-${current.id}-${value}`}
                              style={{
                                cursor: ratingDisabled ? "default" : "pointer",
                                display: "inline-flex",
                                position: "relative",
                                width: 16,
                                height: 16,
                              }}
                              onMouseEnter={() => {
                                if (!ratingDisabled) setHoverRating(value);
                              }}
                              onMouseLeave={() => {
                                if (!ratingDisabled) setHoverRating(0);
                              }}
                              onClick={async () => {
                                if (
                                  ratingDisabled ||
                                  !current.id ||
                                  !ratingCategoryId
                                ) {
                                  return;
                                }

                                const trackId = current.id;

                                const previous = selectedRating;
                                emitTrackRatingSync({
                                  trackId,
                                  categoryId: ratingCategoryId,
                                  value,
                                });
                                setSelectedRating(value);
                                setSavingRating(true);

                                try {
                                  const response = await postTrackRating(
                                    trackId,
                                    ratingCategoryId,
                                    value,
                                  );

                                  if (!response.ok) {
                                    const payload = await response
                                      .json()
                                      .catch(() => null);
                                    addToast({
                                      title:
                                        payload?.message ??
                                        "Failed to save track rating",
                                    });
                                    emitTrackRatingSync({
                                      trackId,
                                      categoryId: ratingCategoryId,
                                      value: previous,
                                    });
                                    setSelectedRating(previous);
                                    return;
                                  }

                                  setViewerTrackRatings((prev) =>
                                    upsertTrackRatingRecord(prev, {
                                      trackId,
                                      categoryId: ratingCategoryId,
                                      value,
                                    }),
                                  );
                                } finally {
                                  setSavingRating(false);
                                }
                              }}
                            >
                              <Star
                                size={16}
                                fill="currentColor"
                                className="absolute"
                                style={{
                                  color:
                                    displayRating >= value
                                      ? colors["yellow"]
                                      : colors["base"],
                                  transition: "color 150ms ease",
                                }}
                              />
                              <Star
                                size={16}
                                fill="currentColor"
                                className="absolute"
                                style={{
                                  clipPath: "inset(0 50% 0 0)",
                                  color:
                                    displayRating >= value - 1
                                      ? colors["yellow"]
                                      : colors["base"],
                                  transition: "color 150ms ease",
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  width: 8,
                                  height: 16,
                                }}
                                onMouseEnter={() => {
                                  if (!ratingDisabled)
                                    setHoverRating(value - 1);
                                }}
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  if (
                                    ratingDisabled ||
                                    !current.id ||
                                    !ratingCategoryId
                                  ) {
                                    return;
                                  }

                                  const trackId = current.id;
                                  const nextValue = value - 1;
                                  const previous = selectedRating;
                                  emitTrackRatingSync({
                                    trackId,
                                    categoryId: ratingCategoryId,
                                    value: nextValue,
                                  });
                                  setSelectedRating(nextValue);
                                  setSavingRating(true);

                                  try {
                                    const response = await postTrackRating(
                                      trackId,
                                      ratingCategoryId,
                                      nextValue,
                                    );

                                    if (!response.ok) {
                                      const payload = await response
                                        .json()
                                        .catch(() => null);
                                      addToast({
                                        title:
                                          payload?.message ??
                                          "Failed to save track rating",
                                      });
                                      emitTrackRatingSync({
                                        trackId,
                                        categoryId: ratingCategoryId,
                                        value: previous,
                                      });
                                      setSelectedRating(previous);
                                      return;
                                    }

                                    setViewerTrackRatings((prev) =>
                                      upsertTrackRatingRecord(prev, {
                                        trackId,
                                        categoryId: ratingCategoryId,
                                        value: nextValue,
                                      }),
                                    );
                                  } finally {
                                    setSavingRating(false);
                                  }
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: 0,
                                  width: 8,
                                  height: 16,
                                }}
                                onMouseEnter={() => {
                                  if (!ratingDisabled) setHoverRating(value);
                                }}
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  if (
                                    ratingDisabled ||
                                    !current.id ||
                                    !ratingCategoryId
                                  ) {
                                    return;
                                  }

                                  const trackId = current.id;
                                  const previous = selectedRating;
                                  emitTrackRatingSync({
                                    trackId,
                                    categoryId: ratingCategoryId,
                                    value,
                                  });
                                  setSelectedRating(value);
                                  setSavingRating(true);

                                  try {
                                    const response = await postTrackRating(
                                      trackId,
                                      ratingCategoryId,
                                      value,
                                    );

                                    if (!response.ok) {
                                      const payload = await response
                                        .json()
                                        .catch(() => null);
                                      addToast({
                                        title:
                                          payload?.message ??
                                          "Failed to save track rating",
                                      });
                                      emitTrackRatingSync({
                                        trackId,
                                        categoryId: ratingCategoryId,
                                        value: previous,
                                      });
                                      setSelectedRating(previous);
                                      return;
                                    }

                                    setViewerTrackRatings((prev) =>
                                      upsertTrackRatingRecord(prev, {
                                        trackId,
                                        categoryId: ratingCategoryId,
                                        value,
                                      }),
                                    );
                                  } finally {
                                    setSavingRating(false);
                                  }
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </RatingVisibilityGate>
                  )}
                </Vstack>
              </Hstack>
            )}
          </Vstack>
          <Vstack>
            <Button
              onClick={() => setMinimized(!minimized)}
              size={minimized ? "xs" : "md"}
            >
              <Icon
                name={minimized ? "maximize2" : "minimize2"}
                size={minimized ? 16 : 24}
              />
            </Button>
            {!minimized && (
              <Button onClick={toggleRepeatState}>
                <Icon
                  name={
                    repeatState === "autoplay"
                      ? "infinity"
                      : repeatState === "repeat"
                        ? "repeat"
                        : "refreshcwoff"
                  }
                />
              </Button>
            )}
          </Vstack>
        </Hstack>
      </div>
    </Popover>
  );
}
