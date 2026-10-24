export * from "./MusicProvider";
export * from "./useMusic";
export type { PlayableTrack, TrackComposer, TrackGame, TrackType } from "./MusicContext";

export { default as RecordDisc } from "./RecordDisc";
export { default as PlayerContextMenu } from "./PlayerContextMenu";
export { useTouchMenu } from "./useTouchMenu";

export { useArtworkAccent } from "./useArtworkAccent";

export { loadWaveform, getAnalyzedDuration } from "./waveform";
