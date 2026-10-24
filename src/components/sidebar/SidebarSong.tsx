"use client";

import { pageVersionUrl, defaultGameVersion } from "@/helpers/pageVersionUrl";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Card } from "bioloom-ui";
import { addToast } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Avatar } from "bioloom-ui";
import {
  type TrackComposer,
  type TrackGame,
  type TrackType as PlayerTrack,
  useMusic,
  RecordDisc,
  useArtworkAccent,
} from "bioloom-miniplayer";
import { PlayerContextMenu, useTouchMenu } from "bioloom-miniplayer";

import { Link } from "bioloom-ui";
import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { useTheme } from "@/providers/useSiteTheme";
import { downloadTrackBySlug } from "@/helpers/trackDownload";
import { Pause, Play, Star } from "lucide-react";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import TrackLicenseLink from "@/components/tracks/TrackLicenseLink";
import { getTrackLicense, TrackOrigin } from "@/helpers/trackLicense";
import {
  GameDataHoverPreview,
  UserHoverPreview,
} from "@/components/hover-previews";

interface SidebarSongProps {
  slug?: string;
  trackId?: number;
  name: string;
  artist?: TrackComposer | null;
  origin?: TrackOrigin;
  externalAuthorName?: string | null;
  thumbnail: string;
  song: string;
  loudnessGainDb?: number | null;
  game: TrackGame;
  pageVersion?: "JAM" | "POST_JAM";
  license?: string | null;
  allowDownload?: boolean;
  allowBackgroundUse?: boolean;
  allowBackgroundUseAttribution?: boolean;
  ratingValue?: number;
  onRate?: (value: number) => Promise<void> | void;
  ratingDisabled?: boolean;
  showRating?: boolean;
  hideRatings?: boolean;
  wide?: boolean;
  rowIndex?: number;
  squareThumbnail?: boolean;
  showGame?: boolean;
  queue?: PlayerTrack[];
  playlistIndex?: number;
  showArtist?: boolean;
}

export default function SidebarSong({
  slug,
  trackId,
  name,
  thumbnail,
  song,
  loudnessGainDb,
  game,
  pageVersion,
  artist,
  origin = "ORIGINAL",
  externalAuthorName,
  license,
  allowDownload,
  allowBackgroundUse,
  allowBackgroundUseAttribution,
  ratingValue = 0,
  onRate,
  ratingDisabled = false,
  showRating = typeof trackId === "number" || Boolean(onRate),
  hideRatings = false,
  wide = false,
  rowIndex,
  squareThumbnail = false,
  showGame = true,
  queue,
  playlistIndex,
  showArtist = true,
}: SidebarSongProps) {
  const uiText = useUiTranslations();
  const playlist = playlistIndex !== undefined;
  const { current, isPlaying, playItem, toggle, clearPlaybackScope, enqueueNext } = useMusic();
  const { colors } = useTheme();
  const artworkAccent = useArtworkAccent(rowIndex !== undefined ? thumbnail || game.soundtrackThumbnail || game.thumbnail || "/images/game-thumbnail.png" : "");
  const selectedStarColor = rowIndex !== undefined ? artworkAccent : colors.yellow;
  const [hoverValue, setHoverValue] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const displayArtist: TrackComposer = artist ?? {
    name: externalAuthorName || "Unknown composer",
    slug: "",
  };
  useEffect(() => {
    setDuration(null);
    if (!playlist || !song) return;
    const audio = new Audio();
    audio.preload = "metadata";
    const updateDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.floor(audio.duration));
      }
    };
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.src = song;
    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeAttribute("src");
      audio.load();
    };
  }, [playlist, song]);
  const displayValue = hoverValue || ratingValue;
  const backgroundUseLabel = allowBackgroundUse
    ? allowBackgroundUseAttribution
      ? "(Stream safe, credit)"
      : "(Stream safe)"
    : null;
  const isCurrent = Boolean(
    (slug && current?.slug === slug) || current?.song === song,
  );
  const togglePlayback = () => {
    if (isCurrent) {
      clearPlaybackScope();
      toggle();
      return;
    }

    void playItem(
      { id: trackId, slug, name, artist: displayArtist, thumbnail, game, song, loudnessGainDb, pageVersion, allowDownload, license, allowBackgroundUse, allowBackgroundUseAttribution },
      queue,
    );
  };

  const [trackMenu, setTrackMenu] = useState<{ x: number; y: number } | null>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const closeTrackMenu = useCallback((restoreFocus = false) => { setTrackMenu(null); if (restoreFocus) menuTrigger.current?.focus(); }, []);
  const touchMenu = useTouchMenu((_, target) => { const rect = target.getBoundingClientRect(); setTrackMenu({ x: rect.left, y: rect.top }); });
  const rating = (
    showRating && (
    <RatingVisibilityGate
      inline
      revealToLeft={wide}
      hiddenByPreference={hideRatings}
      hiddenText="Ratings are hidden by your settings."
      buttonSize="xs"
    >
      <Hstack className={hideRatings || wide ? "shrink-0 gap-1" : playlist ? "gap-1 pl-12" : "justify-center gap-1 pt-2"}>
        {[2, 4, 6, 8, 10].map((value) => (
          <div
            key={`${trackId ?? slug ?? name}-${value}`}
            className={`relative h-4 w-4 ${ratingDisabled ? "cursor-default" : "cursor-pointer"}`}
            onMouseEnter={() => {
              if (!ratingDisabled) setHoverValue(value);
            }}
            onMouseLeave={() => {
              if (!ratingDisabled) setHoverValue(0);
            }}
          >
            <Star
              size={16}
              fill="currentColor"
              className="absolute"
              style={{
                color:
                  displayValue >= value
                    ? selectedStarColor
                    : `color-mix(in srgb, ${colors.gray} 32%, black)`,
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
                  displayValue >= value - 1
                    ? selectedStarColor
                    : `color-mix(in srgb, ${colors.gray} 32%, black)`,
                transition: "color 150ms ease",
              }}
            />
            <div
              className="absolute left-0 top-0 h-4 w-2"
              onMouseEnter={() => {
                if (!ratingDisabled) setHoverValue(value - 1);
              }}
              onClick={() => {
                if (!ratingDisabled) {
                  void onRate?.(value - 1);
                }
              }}
            />
            <div
              className="absolute right-0 top-0 h-4 w-2"
              onMouseEnter={() => {
                if (!ratingDisabled) setHoverValue(value);
              }}
              onClick={() => {
                if (!ratingDisabled) {
                  void onRate?.(value);
                }
              }}
            />
          </div>
        ))}
      </Hstack>
    </RatingVisibilityGate>
  )
  );

  return (<>
    <Card
      className={playlist || rowIndex !== undefined ? undefined : "post-card-shadow"}
      padding={wide ? 0 : 1}
      style={{
        "--post-card-shadow": `color-mix(in srgb, ${colors["crust"]} 68%, transparent)`,
        ...(rowIndex !== undefined ? {
          border: 0,
          borderRadius: 0,
          boxShadow: "none",
          transition: "none",
          backgroundColor: rowIndex % 2 === 1
            ? `color-mix(in srgb, ${colors.text} 4%, ${colors.mantle})`
            : colors.mantle,
        } : {}),
        ...(playlist ? {
          border: 0,
          borderTop: playlistIndex === 0 ? 0 : `1px solid color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`,
          borderRadius: 0,
          boxShadow: "none",
          padding: "4px 0",
          paddingTop: 4, paddingBottom: 4, paddingLeft: 0, paddingRight: 0,
          backgroundColor: "transparent",
        } : {}),
      } as CSSProperties}
    >
      <Vstack align="stretch" gap={playlist ? 1 : 2}>
        <Hstack
          justify="between"
          gap={wide ? 4 : 2}
          className={wide ? `min-h-24 min-w-0 p-3 sm:p-4 ${rowIndex !== undefined ? "flex-wrap" : ""} ${rating && rowIndex === undefined ? "!grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto_7.5rem]" : ""}` : ""}
        >
          <Hstack gap={wide || squareThumbnail ? 3 : 2} className="min-w-0 flex-1">
            {playlist ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={togglePlayback}
                aria-label={uiText("AppStrings.Value0Value1", { value0: isCurrent && isPlaying ? "Pause" : "Play", value1: name })}
                className="group/track-play relative !h-7 !w-7 shrink-0 !rounded-md !p-0"
              >
                <span className={isCurrent ? "hidden" : "text-xs tabular-nums group-hover/track-play:hidden group-focus-visible/track-play:hidden"}>
                  {String(playlistIndex + 1).padStart(2, "0")}
                </span>
                <span className={isCurrent ? "flex" : "hidden group-hover/track-play:flex group-focus-visible/track-play:flex"}>
                  {isCurrent && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </span>
              </Button>
            ) : <button
              type="button"
              className={"sidebar-song-disc-button relative block flex-none p-0 [border:0] rounded-full bg-transparent cursor-[pointer] text-[#e5fff0] [box-shadow:0_3px_8px_#0005] [&_.sidebar-song-disc]:w-full [&_.sidebar-song-disc]:h-full [&_.sidebar-song-disc]:animate-[spin_8s_linear_infinite] [&_.sidebar-song-disc]:[animation-play-state:paused] [&[data-playing='true']_.sidebar-song-disc]:[animation-play-state:running] [&:is(:hover,:focus-visible,[aria-expanded='true'])_.record-disc-label]:[filter:brightness(.72)] [&:is(:hover,:focus-visible,[aria-expanded='true'])_.record-disc-details]:opacity-0 [&:is(:hover,:focus-visible,[aria-expanded='true'])_.sidebar-song-disc-action]:opacity-[1] [&:focus-visible]:[outline:2px_solid_currentColor] [&:focus-visible]:outline-offset-[3px] [@media(prefers-reduced-motion:reduce)]:[&_.sidebar-song-disc]:animate-none [@media(hover:none)]:[&_.record-disc-label]:[filter:brightness(.72)] [@media(hover:none)]:[&_.record-disc-details]:opacity-0 "} ref={menuTrigger} data-touch-menu="track" {...touchMenu}
              aria-haspopup="menu" aria-expanded={Boolean(trackMenu)}
              onContextMenu={event => { event.preventDefault(); setTrackMenu({ x: event.clientX, y: event.clientY }); }}
              onKeyDown={event => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); setTrackMenu({ x: rect.left, y: rect.top }); } }}
              style={{ width: wide ? 96 : squareThumbnail ? (showGame ? 80 : 64) : 50, height: wide ? 96 : squareThumbnail ? (showGame ? 80 : 64) : 50 }}
              onClick={togglePlayback}
              aria-label={`${isCurrent && isPlaying ? "Pause" : "Play"} ${name}`}
              data-playing={isCurrent && isPlaying}
            >
              <RecordDisc artwork={thumbnail} className="sidebar-song-disc"/>
              <span className={"sidebar-song-disc-action absolute inset-[13%] grid place-items-center opacity-0 pointer-events-none [filter:drop-shadow(0_2px_5px_#07111acc)] [&_svg]:w-full [&_svg]:h-full [&_svg]:[stroke-width:1.3] [@media(hover:none)]:opacity-[1] "} aria-hidden="true">
                {isCurrent && isPlaying ? <Pause fill="currentColor"/> : <Play fill="currentColor"/>}
              </span>
            </button>}
            <Vstack className={playlist ? "z-10 min-w-0 flex-1" : "z-10 min-w-0"} align="start" gap={wide ? 1 : 0}>
              <Link
                href={
                  slug
                    ? pageVersionUrl(`/m/${slug}`, pageVersion, defaultGameVersion(game))
                    : pageVersionUrl(`/g/${game.slug}`, pageVersion, defaultGameVersion(game))
                }
                underline={false}
                className={playlist ? "sidebar-media-link max-w-full" : "sidebar-media-link"}
                style={{ textDecoration: "none" }}
              >
                <Text
                  size={playlist ? "xs" : wide ? "lg" : undefined}
                  weight={playlist ? "normal" : wide ? "semibold" : undefined}
                  className={playlist ? "max-w-full truncate text-xs font-normal" : "max-w-full truncate"}
                  style={playlist && isCurrent ? { color: colors.blue } : undefined}
                >
                  {name}
                </Text>
              </Link>
              {showGame && (
                <GameDataHoverPreview
                  game={{
                    slug: game.slug ?? "",
                    name: game.name ?? game.slug ?? "Game",
                    thumbnail: game.thumbnail,
                    pageVersion,
                  }}
                >
                  <Link
                    href={pageVersionUrl(`/g/${game.slug}`, pageVersion, defaultGameVersion(game))}
                    underline={false}
                    className="sidebar-media-link"
                    style={{ textDecoration: "none" }}
                  >
                    <Text size="xs" color="textFaded">
                      {game.name}
                      {game.category !== "EXTERNAL" &&
                        pageVersion === "POST_JAM" &&
                        <>{" "}{uiText("AppStrings.PostJam")}</>}
                    </Text>
                  </Link>
                </GameDataHoverPreview>
              )}
              {showArtist && <Hstack gap={1} align="baseline" justify="start" className={playlist ? "min-w-0 w-full" : "min-w-0"}>
                {origin === "ASSET_PACK" ? (
                  <Text
                    size={playlist ? "xs" : "sm"}
                    color={playlist ? "text" : "textFaded"}
                    className="max-w-full truncate"
                  >
                    {externalAuthorName || displayArtist.name}
                  </Text>
                ) : artist?.slug ? (
                <UserHoverPreview
                  portal
                  user={{
                    slug: displayArtist.slug ?? "",
                    name: displayArtist.name,
                    profilePicture: displayArtist.profilePicture,
                  }}
                >
                  <Link
                    href={`/u/${displayArtist.slug}`}
                    underline={false}
                    className="sidebar-media-link inline-flex min-w-0 items-center gap-1"
                    style={{ textDecoration: "none" }}
                  >
                    {!playlist && (wide || squareThumbnail) && (
                      <Avatar
                        size={16}
                        src={displayArtist.profilePicture || "/images/D2J_Icon.png"}
                      />
                    )}
                    <Text
                      size={playlist ? "xs" : "sm"}
                      color={playlist ? "text" : "textFaded"}
                      className="max-w-full truncate"
                    >
                      {displayArtist.name || displayArtist.slug}
                    </Text>
                  </Link>
                </UserHoverPreview>) : artist?.name ? (
                  <Text
                    size={playlist ? "xs" : "sm"}
                    color={playlist ? "text" : "textFaded"}
                    className="max-w-full truncate"
                  >
                    {artist.name}
                  </Text>
                ) : null}
                {playlist && duration !== null && (
                  <span className="shrink-0 pl-2 text-xs leading-4 tabular-nums" style={{ color: colors.text }}>
                    {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
                  </span>
                )}
                {playlist && (license || backgroundUseLabel) && (
                  <span
                    className="min-w-0 truncate pl-2 text-xs leading-4"
                    style={{ color: colors.textFaded }}
                    title={[license ? getTrackLicense(license).label : "", backgroundUseLabel].filter(Boolean).join(" ")}
                  >
                    {license && <TrackLicenseLink license={license} />}
                    {backgroundUseLabel ? ` ${backgroundUseLabel}` : ""}
                  </span>
                )}
              </Hstack>}
              {!playlist && license && (
                <span
                  className={playlist ? "max-w-full truncate text-xs" : "max-w-full truncate rounded px-2 py-0.5 text-xs"}
                  style={{
                    backgroundColor: playlist ? "transparent" : colors["base"],
                    color: colors["textFaded"],
                  }}
                  title={uiText("AppStrings.Value0Value13", { value0: getTrackLicense(license).label, value1: backgroundUseLabel ? ` ${backgroundUseLabel}` : "" })}
                >
                  <TrackLicenseLink license={license} />
                  {backgroundUseLabel ? ` ${uiText("AppStrings.Value08", { value0: backgroundUseLabel })}` : ""}
                </span>
              )}
            </Vstack>
          </Hstack>

          {wide && rowIndex === undefined && rating && (
            <div className="col-span-2 row-start-2 justify-self-center p-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
              {rating}
            </div>
          )}

          <div
            className={
              wide && rowIndex === undefined
                ? "col-start-2 row-start-1 flex shrink-0 items-center justify-self-end gap-2 sm:col-start-3"
                : rowIndex !== undefined ? "ml-auto flex shrink-0 items-center gap-2" : "flex shrink-0 flex-col items-center gap-2"
            }
          >
            {wide && rowIndex !== undefined && rating && <div className="mr-2">{rating}</div>}
            {!playlist && <Button
              size="sm"
              color="default"
              className="!h-9 !w-14 !rounded-md !p-0"
              icon={isCurrent && isPlaying ? "pause" : "play"}
              aria-label={isCurrent && isPlaying ? uiText("AppStrings.PauseTrack") : uiText("AppStrings.PlayTrack")}
              onClick={togglePlayback}
            />}
            {allowDownload && (
              <Button
                size="sm"
                color="default"
                className={playlist ? "!h-7 !w-7 !rounded-md !p-0" : "!h-9 !w-14 !rounded-md !p-0"}
                variant={playlist ? "ghost" : undefined}
                loading={isDownloading}
                icon="download"
                aria-label={uiText("AppStrings.DownloadTrack2")}
                onClick={async () => {
                  if (!slug) return;

                  try {
                    setIsDownloading(true);
                    await downloadTrackBySlug(slug, name, pageVersion);
                  } catch (error) {
                    console.error(error);
                    addToast({ title: uiText("AppStrings.FailedToDownloadTrack") });
                  } finally {
                    setIsDownloading(false);
                  }
                }}
              />
            )}
          </div>
        </Hstack>

        {!wide && rating}
      </Vstack>
    </Card>
    {trackMenu && <PlayerContextMenu track={{ id: trackId, slug, name, artist: displayArtist, thumbnail, game, song, loudnessGainDb, pageVersion, allowDownload, license, allowBackgroundUse, allowBackgroundUseAttribution }} x={trackMenu.x} y={trackMenu.y} accent={artworkAccent} surfaceGradient={`linear-gradient(90deg, color-mix(in srgb, ${artworkAccent} 24%, #1a2936), #1a2936)`} onClose={closeTrackMenu} onPlayNext={!isCurrent ? () => {
      if (!current?.song) { togglePlayback(); return; }
      enqueueNext({ id: trackId, slug, name, composer: displayArtist, game: { ...game, soundtrackThumbnail: thumbnail || game.soundtrackThumbnail }, url: song, loudnessGainDb, pageVersion, allowDownload, license, allowBackgroundUse, allowBackgroundUseAttribution });
    } : undefined}/>}</>
  );
}
