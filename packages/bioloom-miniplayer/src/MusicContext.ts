import { createContext } from "react";

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

export type MusicContextValue = {
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

export const MusicContext = createContext<MusicContextValue | null>(null);
