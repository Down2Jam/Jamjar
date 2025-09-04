"use client";

import { Button } from "@/framework/Button";
import Icon from "@/framework/Icon";
import Popover from "@/framework/Popover";
import { BASE_URL } from "@/requests/config";
import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "./SiteThemeProvider";
import Text from "@/framework/Text";
import { Hstack, Vstack } from "@/framework/Stack";
import { TrackType } from "@/types/TrackType";

type Track = {
  name: string;
  artist: string;
  thumbnail: string;
  game: string;
  song: string;
};

type MusicContextValue = {
  audioEl: HTMLAudioElement | null;
  currentIndex: number | null;
  current: Track | null;
  isPlaying: boolean;
  toggle: () => void;
  volume: number;
  playItem: (t: Track) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  canPrev: boolean;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  repeatState: "none" | "repeat" | "autoplay";
  toggleRepeatState: () => void;
  stop: () => void;
  shown: boolean;
  setShown: (val: boolean) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useState(0.5);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const nextRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const [backStack, setBackStack] = useState<number[]>([]);
  const [fwdStack, setFwdStack] = useState<number[]>([]);
  const [repeatState, setRepeatState] = useState<
    "none" | "repeat" | "autoplay"
  >("autoplay");
  const repeatStateRef = useRef(repeatState);
  const [shown, setShown] = useState<boolean>(false);
  const [music, setMusic] = useState<TrackType[]>([]);

  const playIndex = useCallback(
    async (i: number) => {
      if (!audioRef.current || !music[i]) return;
      const audio = audioRef.current;
      const track = music[i];
      const src = track.url;
      if (audio.src !== src) audio.src = src;
      audio.volume = volume;
      setCurrentIndex(i);
      await audio.play();

      setShown(true);
    },
    [volume, music]
  );

  useEffect(() => {
    repeatStateRef.current = repeatState;
  }, [repeatState]);

  const next = useCallback(async () => {
    // forward replay path
    if (fwdStack.length > 0) {
      setFwdStack((fs) => {
        const nextIdx = fs[fs.length - 1];
        if (currentIndex != null) {
          setBackStack((bs) =>
            bs[bs.length - 1] === currentIndex ? bs : [...bs, currentIndex]
          );
        }
        setTimeout(() => void playIndex(nextIdx), 0);
        return fs.slice(0, -1);
      });
      return;
    }

    // normal random next
    if (!music.length) return;
    const cur = currentIndex ?? -1;
    let nextIdx = 0;
    if (music.length > 1) {
      do nextIdx = Math.floor(Math.random() * music.length);
      while (nextIdx === cur);
    }

    if (currentIndex != null) {
      setBackStack((bs) =>
        bs[bs.length - 1] === currentIndex ? bs : [...bs, currentIndex]
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
    [duration]
  );

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";

    async function fetchData() {
      const res = await fetch(`${BASE_URL}/tracks`);
      const json = await res.json();

      setMusic(json.data);
    }

    fetchData();

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
          : [...fs, currentIndex]
      );

      setTimeout(() => void playIndex(target), 0);
      return bs.slice(0, -1);
    });
  }, [currentIndex, playIndex]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
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
    async (t: Track) => {
      const i = music.findIndex((x) => x.url === t.song);
      if (i >= 0) {
        setBackStack((bs) =>
          currentIndex == null || bs[bs.length - 1] === currentIndex
            ? bs
            : [...bs, currentIndex]
        );
        setFwdStack([]);
        await playIndex(i);
        return;
      }
      if (!audioRef.current) return;
      const audio = audioRef.current;
      audio.src = t.song;
      audio.volume = volume;
      setBackStack((bs) =>
        currentIndex == null || bs[bs.length - 1] === currentIndex
          ? bs
          : [...bs, currentIndex]
      );
      setFwdStack([]);
      setCurrentIndex(null);
      await audio.play();
    },
    [currentIndex, playIndex, volume, music]
  );

  const value = useMemo(
    () => ({
      audioEl: audioRef.current,
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
      toggleRepeatState,
      repeatState,
      stop,
      shown,
      setShown,
    }),
    [
      audioRef,
      playItem,
      current,
      isPlaying,
      volume,
      currentIndex,
      next,
      prev,
      seek,
      setVolume,
      backStack.length,
      toggleRepeatState,
      repeatState,
      stop,
      shown,
    ]
  );

  return (
    <MusicContext.Provider
      value={{
        ...value,
        current: {
          song: value.current?.url || "",
          name: value.current?.name || "",
          artist: value.current?.composer.name || "",
          thumbnail: value.current?.game.thumbnail || "/images/D2J_Icon.png",
          game: value.current?.game.name || "",
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

/** Bottom-left mini player with Skip/Prev */
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
    repeatState,
    toggleRepeatState,
    stop,
    shown,
    setShown,
  } = useMusic();
  const [progress, setProgress] = useState({ time: 0, duration: 0 });
  const { colors } = useTheme();
  const [minimized, setMinimized] = useState<boolean>(false);

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

  if (!current) return null;

  return (
    <Popover
      position="bottom-left"
      showCloseButton
      closeButtonPosition="top-left"
      onClose={stop}
      startsShown={true}
      shown={shown}
      onShownChange={setShown}
    >
      <Hstack>
        <Vstack align="stretch">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Image
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
                {current.name}
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
                {current.game} — {current.artist}
              </div>
            </div>

            {/* Controls */}
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
                {/* Seek */}
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

                {/* Volume */}
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
    </Popover>
  );
}
