import { type PlayerUI, type PlayerTrackActions } from "bioloom-miniplayer";
import type { PlayableTrack } from "bioloom-miniplayer/core";
import Link from "@/compat/next-link";
import { UserHoverPreview } from "@/components/hover-previews";
import { addToast } from "bioloom-ui";
import {
  pageVersionUrl,
  defaultGameVersion,
  defaultTrackVersion,
} from "@/helpers/pageVersionUrl";
import { downloadTrackBySlug } from "@/helpers/trackDownload";
import { getTrackLicense } from "@/helpers/trackLicense";
import { getTrack } from "@/requests/track";
import { readItem } from "@/requests/helpers";
import type { TrackType } from "@/types/TrackType";
import PlayerRating from "./PlayerRating";

function getTrackActions(
  track: PlayableTrack,
  details?: TrackType,
): PlayerTrackActions {
  const version = details?.pageVersion ?? track.pageVersion;
  const defaultVersion = details
    ? defaultTrackVersion(details)
    : defaultGameVersion(track.game);
  const license = details ? details.license : track.license;
  const streamSafe = details?.allowBackgroundUse ?? track.allowBackgroundUse;
  const credit =
    details?.allowBackgroundUseAttribution ??
    track.allowBackgroundUseAttribution;
  return {
    trackHref: track.slug
      ? pageVersionUrl("/m/" + track.slug, version, defaultVersion)
      : undefined,
    artistHref: track.artist.slug ? "/u/" + track.artist.slug : undefined,
    collectionHref: track.game.slug
      ? pageVersionUrl("/g/" + track.game.slug, version, defaultVersion)
      : undefined,
    download:
      (details?.allowDownload ?? track.allowDownload) && track.slug
        ? () => downloadTrackBySlug(track.slug!, track.name, version)
        : undefined,
    downloadLabel:
      license !== undefined ? (
        <>
          {getTrackLicense(license).label}
          {streamSafe && (
            <span className="text-[#80cfae]">
              {credit ? " (Stream safe, credit)" : " (Stream safe)"}
            </span>
          )}
        </>
      ) : undefined,
  };
}

export const playerUI: PlayerUI = {
  Link: ({ href, ...props }) =>
    href ? <Link href={href} {...props} /> : <span {...props} />,
  getTrackActions,
  async loadTrackActions(track) {
    if (!track.slug) return getTrackActions(track);
    const response = await getTrack(track.slug, track.pageVersion);
    let details = response.ok ? await readItem<TrackType>(response) : null;
    if (details && track.id != null && details.id !== track.id) {
      const other = await getTrack(
        track.slug,
        details.pageVersion === "POST_JAM" ? "JAM" : "POST_JAM",
      );
      details = other.ok ? await readItem<TrackType>(other) : null;
    }
    return getTrackActions(
      track,
      details && (track.id == null || details.id === track.id)
        ? details
        : undefined,
    );
  },
  renderArtist: (track) => (
    <UserHoverPreview
      user={{ ...track.artist, slug: track.artist.slug! }}
      portal
      className="max-w-full align-bottom [&>a]:truncate"
    >
      <Link href={"/u/" + track.artist.slug}>
        {track.artist.name?.trim() || track.artist.slug}
      </Link>
    </UserHoverPreview>
  ),
  renderRating: (track) => (
    <PlayerRating key={track.id ?? track.song} track={track} />
  ),
  historyHref: "/music/history",
  resolveArtwork(source) {
    if (!source || typeof window === "undefined") return source;
    const url = new URL(source, window.location.href);
    return url.pathname.startsWith("/api/v1/image/")
      ? url.pathname + url.search
      : source;
  },
  fallbackArtwork: "/images/game-thumbnail.png",
  onError: (message) => addToast({ title: message }),
};
