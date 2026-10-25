import {
  createContext,
  useContext,
  type ComponentType,
  type ComponentProps,
  type ReactNode,
} from "react";
import type { PlayableTrack } from "./MusicContext";

export type PlayerTrackActions = {
  trackHref?: string;
  artistHref?: string;
  collectionHref?: string;
  download?: () => Promise<void>;
  downloadLabel?: ReactNode;
};

export type PlayerUI = {
  Link: ComponentType<ComponentProps<"a">>;
  getTrackActions?: (track: PlayableTrack) => PlayerTrackActions;
  loadTrackActions?: (track: PlayableTrack) => Promise<PlayerTrackActions>;
  renderArtist?: (track: PlayableTrack) => ReactNode;
  renderRating?: (track: PlayableTrack) => ReactNode;
  historyHref?: string;
  fallbackArtwork?: string;
  resolveArtwork?: (source: string) => string;
  onError?: (message: string) => void;
};

const PlayerUIContext = createContext<PlayerUI>({
  Link: (props) => <a {...props} />,
});
export const PlayerUIProvider = PlayerUIContext.Provider;
export const usePlayerUI = () => useContext(PlayerUIContext);
