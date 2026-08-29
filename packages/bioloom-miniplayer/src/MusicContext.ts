import { createContext } from "react";

export type TrackComposer = {
  name?: string;
  slug?: string;
  profilePicture?: string | null;
};

export type TrackGame = {
  id?: number;
  jamId?: number;
  category?: "ODA" | "REGULAR" | "EXTRA" | "EXTERNAL";
  name?: string;
  thumbnail?: string;
  soundtrackThumbnail?: string | null;
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
  loudnessGainDb?: number | null;
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
  loudnessGainDb?: number | null;
};

export type MusicContextValue = {
  audioEl: HTMLAudioElement | null;
  analyser: AnalyserNode | null;
  currentIndex: number | null;
  current: PlayableTrack | null;
  isPlaying: boolean;
  toggle: () => void;
  volume: number;
  playItem: (t: PlayableTrack, queue?: TrackType[]) => Promise<void>;
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
