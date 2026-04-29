"use client";

import {
  useCallback,
  useEffect,
  lazy,
  useMemo,
  useRef,
  Suspense,
  useState,
} from "react";
import {
  MusicContext,
  type PlayableTrack,
  type TrackType,
} from "./MusicContext";

const MiniPlayer = lazy(() => import("./MiniPlayer"));

export const storageKey = {
  volume: "music_volume",
  repeat: "music_repeat",
  minimized: "music_minimized",
  corner: "music_corner",
} as const;

export const readStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
};

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
  const [externalTrack, setExternalTrack] = useState<TrackType | null>(null);
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
      setExternalTrack(null);
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

  const current = currentIndex == null ? externalTrack : music[currentIndex];

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
      setExternalTrack({
        id: t.id,
        slug: t.slug,
        url: t.song,
        name: t.name,
        composer: t.artist,
        game: t.game,
      });
      setBackStack((bs) =>
        currentIndex == null || bs[bs.length - 1] === currentIndex
          ? bs
          : [...bs, currentIndex],
      );
      setFwdStack([]);
      setCurrentIndex(null);
      await audio.play();
      setShown(true);
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
      {value.current ? (
        <Suspense fallback={null}>
          <MiniPlayer />
        </Suspense>
      ) : null}
    </MusicContext.Provider>
  );
}

