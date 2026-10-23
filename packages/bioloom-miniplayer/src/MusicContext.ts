import { createContext } from "react";

export type TrackComposer = {
  id?: number;
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
    ownerId?: number;
    users?: Array<{
      id: number;
    }>;
  };
};

export type TrackType = {
  tags?: Array<{ id?: number; name: string; category?: { name: string } }>;
  bpm?: number | null;
  id?: number;
  slug?: string;
  url: string;
  playedAt?: number;
  name: string;
  loudnessGainDb?: number | null;
  pageVersion?: "JAM" | "POST_JAM";
  allowDownload?: boolean;
  license?: string | null;
  allowBackgroundUse?: boolean;
  allowBackgroundUseAttribution?: boolean;
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
  pageVersion?: "JAM" | "POST_JAM";
  allowDownload?: boolean;
  license?: string | null;
  allowBackgroundUse?: boolean;
  allowBackgroundUseAttribution?: boolean;
};

export type MusicContextValue = {
  audioEl: HTMLAudioElement | null;
  analyser: AnalyserNode | null;
  currentIndex: number | null;
  current: PlayableTrack | null;
  isPlaying: boolean;
  playbackScope: string | null;
  toggle: () => void;
  clearPlaybackScope: () => void;
  volume: number;
  playItem: (t: PlayableTrack, queue?: TrackType[], options?: { preserveQueue?: boolean; shuffle?: boolean; scope?: string }) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  canPrev: boolean;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  tracks: TrackType[];
  upcoming: TrackType[];
  moveQueued: (from: number, to: number) => void;
  removeQueued: (index: number) => void;
  enqueueNext: (track: TrackType) => void;
  transitionMode: "off" | "crossfade" | "automix";
  setTransitionMode: (mode: "off" | "crossfade" | "automix") => void;
  transitionLead: number;
  shuffle: boolean;
  toggleShuffle: () => void;
  history: TrackType[];
  setTracks: (tracks: TrackType[]) => void;
  repeatState: "none" | "repeat" | "autoplay";
  setRepeatState: (mode: "none" | "repeat" | "autoplay") => void;
  toggleRepeatState: () => void;
  stop: () => void;
  shown: boolean;
  setShown: (val: boolean) => void;
};

export const MusicContext = createContext<MusicContextValue | null>(null);
