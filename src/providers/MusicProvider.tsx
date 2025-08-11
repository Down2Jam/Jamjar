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

type Track = {
  name: string;
  artist: string;
  thumbnail: string;
  game: string;
  song: string;
};

const music = [
  {
    name: "Main Theme",
    artist: "Brainoid",
    thumbnail: "/images/test-images/8vu7cm9a.bmp",
    game: "Sammich",
    song: "Sammich.ogg",
  },
  {
    name: "Emmett The Loopwalker",
    artist: "Brainoid",
    thumbnail: "/images/test-images/Emmet.png",
    game: "Loopwalker",
    song: "Emmet.ogg",
  },
  {
    name: "Cootsmania",
    artist: "Brainoid",
    thumbnail: "/images/test-images/LDcA_C.png",
    game: "Cootsmania",
    song: "Cootsmania.mp3",
  },
  {
    name: "Cool Track, Fun Track",
    artist: "Brainoid",
    thumbnail: "/images/test-images/H6Bcjg.png",
    game: "Ryder Funk",
    song: "Cool Track, Fun Track.ogg",
  },
  {
    name: "Horse Soop All the Way",
    artist: "Brainoid",
    thumbnail: "/images/test-images/H6Bcjg.png",
    game: "Ryder Funk",
    song: "Horse Soop All the Way.ogg",
  },
  {
    name: "Death Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Death Ante.ogg",
  },
  {
    name: "Easy Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Easy Ante.ogg",
  },
  {
    name: "First Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "First Ante.ogg",
  },
  {
    name: "Hard Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Hard Ante.ogg",
  },
  {
    name: "Legendary Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Legendary Ante.ogg",
  },
  {
    name: "Medium Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Medium Ante.ogg",
  },
  {
    name: "Shop 1",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Shop 1.ogg",
  },
  {
    name: "Shop 2",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Shop 2.ogg",
  },
  {
    name: "Very Easy Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Very Easy Ante.ogg",
  },
  {
    name: "Very Hard Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Rocket Mobilization",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Global Technical Progress",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Celestial Simulations",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Training Complexities",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Last Moments on Terra",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Launch Anticipation",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Leaving Terra",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Traveling Through Local Space",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Positive Reflections",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "Very Hard Ante.ogg",
  },
  {
    name: "Mission Completion",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "10_Mission Completion.mp3",
  },
];

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

  const playIndex = useCallback(
    async (i: number) => {
      if (!audioRef.current || !music[i]) return;
      const audio = audioRef.current;
      const track = music[i];
      const src = srcFor(track);
      if (audio.src !== src) audio.src = src;
      audio.volume = volume;
      setCurrentIndex(i);
      await audio.play();
    },
    [volume]
  );

  const next = useCallback(async () => {
    // forward replay path
    if (fwdStack.length > 0) {
      setFwdStack((fs) => {
        const nextIdx = fs[fs.length - 1];
        if (currentIndex != null) setBackStack((bs) => [...bs, currentIndex]);
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
    if (currentIndex != null) setBackStack((bs) => [...bs, currentIndex]);
    await playIndex(nextIdx);
  }, [currentIndex, fwdStack.length, playIndex]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => {
      void nextRef.current();
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
      if (currentIndex != null) setFwdStack((fs) => [...fs, currentIndex]);
      setTimeout(() => void playIndex(target), 0);
      return bs.slice(0, -1);
    });
  }, [currentIndex, playIndex]);

  const seek = useCallback(
    (t: number) => {
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = Math.min(Math.max(0, t), duration || 0);
    },
    [duration]
  );

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  const srcFor = (t: Track) =>
    `${BASE_URL}/music/${encodeURIComponent(t.song)}`;

  const current = currentIndex == null ? null : music[currentIndex];

  const playItem = useCallback(
    async (t: Track) => {
      const i = music.findIndex((x) => x.song === t.song);
      if (i >= 0) {
        if (currentIndex != null) setBackStack((bs) => [...bs, currentIndex]);
        setFwdStack([]);
        await playIndex(i);
        return;
      }
      if (!audioRef.current) return;
      const audio = audioRef.current;
      audio.src = srcFor(t);
      audio.volume = volume;
      if (currentIndex != null) setBackStack((bs) => [...bs, currentIndex]);
      setFwdStack([]);
      setCurrentIndex(null);
      await audio.play();
    },
    [currentIndex, playIndex, volume]
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
      canPrev: backStack.length > 1,
      seek,
      setVolume,
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
    ]
  );

  return (
    <MusicContext.Provider value={value}>
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
  } = useMusic();
  const [progress, setProgress] = useState({ time: 0, duration: 0 });
  const { colors } = useTheme();

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
    <Popover position="bottom-left" shown>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Image
          src={current.thumbnail}
          width={56}
          height={56}
          style={{ borderRadius: 8, objectFit: "cover" }}
          alt=""
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
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
              fontSize: 12,
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
          <Button onClick={prev} disabled={!canPrev}>
            <Icon name="skipback" color={canPrev ? "text" : "textFaded"} />
          </Button>
          <Button onClick={toggle}>
            {isPlaying ? <Icon name="pause" /> : <Icon name="play" />}
          </Button>
          <Button onClick={next}>
            <Icon name="skipforward" />
          </Button>
        </div>
      </div>

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
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
      >
        <Text color="text" size={12}>
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
    </Popover>
  );
}
