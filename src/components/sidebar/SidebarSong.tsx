"use client";

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
} from "bioloom-miniplayer";
import Image from "@/compat/next-image";
import { Link } from "bioloom-ui";
import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { useTheme } from "@/providers/useSiteTheme";
import { downloadTrackBySlug } from "@/helpers/trackDownload";
import { Pause, Play, Star } from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import {
  GameDataHoverPreview,
  UserHoverPreview,
} from "@/components/hover-previews";

interface SidebarSongProps {
  slug?: string;
  trackId?: number;
  name: string;
  artist: TrackComposer;
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
  squareThumbnail = false,
  showGame = true,
  queue,
  playlistIndex,
  showArtist = true,
}: SidebarSongProps) {
  const playlist = playlistIndex !== undefined;
  const { current, isPlaying, playItem, toggle } = useMusic();
  const { colors } = useTheme();
  const [hoverValue, setHoverValue] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
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
      toggle();
      return;
    }

    void playItem(
      { slug, name, artist, thumbnail, game, song, loudnessGainDb },
      queue,
    );
  };

  return (
    <Card
      className={playlist ? undefined : "post-card-shadow"}
      padding={wide ? 0 : 1}
      style={{
        "--post-card-shadow": `color-mix(in srgb, ${colors["crust"]} 68%, transparent)`,
        ...(playlist ? {
          border: 0,
          borderTop: `1px solid color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`,
          borderRadius: 0,
          boxShadow: "none",
          padding: "4px 0",
          paddingTop: 4, paddingBottom: 4, paddingLeft: 0, paddingRight: 0,
          backgroundColor: "transparent",
        } : {}),
      } as CSSProperties}
    >
      <Vstack align="stretch" gap={2}>
        <Hstack
          justify="between"
          gap={wide ? 4 : 2}
          className={wide ? "min-h-24 min-w-0 p-3 sm:p-4" : ""}
        >
          <Hstack gap={wide || squareThumbnail ? 3 : 2} className="min-w-0 flex-1">
            {playlist ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={togglePlayback}
                aria-label={`${isCurrent && isPlaying ? "Pause" : "Play"} ${name}`}
                className="group/track-play relative !h-7 !w-7 shrink-0 !rounded-md !p-0"
              >
                <span className={isCurrent ? "hidden" : "text-xs tabular-nums group-hover/track-play:hidden group-focus-visible/track-play:hidden"}>
                  {String(playlistIndex + 1).padStart(2, "0")}
                </span>
                <span className={isCurrent ? "flex" : "hidden group-hover/track-play:flex group-focus-visible/track-play:flex"}>
                  {isCurrent && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </span>
              </Button>
            ) : <Image
              src={thumbnail}
              width={wide ? 96 : squareThumbnail ? (showGame ? 80 : 64) : 50}
              height={wide ? 96 : squareThumbnail ? (showGame ? 80 : 64) : 50}
              className={
                wide
                  ? "z-0 h-24 w-24 shrink-0 rounded-md object-cover"
                  : squareThumbnail
                    ? showGame
                      ? "z-0 h-20 w-20 shrink-0 rounded-md object-cover"
                      : "z-0 h-16 w-16 shrink-0 rounded-md object-cover"
                    : "z-0 h-[50px] w-[50px] shrink-0 rounded object-cover"
              }
              alt="Song Thumbnail"
            />}
            <Vstack className={playlist ? "z-10 min-w-0 flex-1" : "z-10 min-w-0"} align="start" gap={wide ? 1 : 0}>
              <Link
                href={
                  slug
                    ? `/m/${slug}${pageVersion ? `?pageVersion=${pageVersion}` : ""}`
                    : `/g/${game.slug}${pageVersion ? `?pageVersion=${pageVersion}` : ""}`
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
                    href={`/g/${game.slug}${pageVersion ? `?pageVersion=${pageVersion}` : ""}`}
                    underline={false}
                    className="sidebar-media-link"
                    style={{ textDecoration: "none" }}
                  >
                    <Text size="xs" color="textFaded">
                      {game.name}
                      {game.category !== "EXTERNAL" &&
                        (pageVersion === "POST_JAM"
                          ? " · Post-Jam"
                          : pageVersion === "JAM"
                            ? " · Jam"
                            : "")}
                    </Text>
                  </Link>
                </GameDataHoverPreview>
              )}
              {showArtist && <Hstack gap={1} align="baseline" justify="start" className={playlist ? "min-w-0 w-full" : "min-w-0"}>
                <UserHoverPreview
                  portal
                  user={{
                    slug: artist.slug ?? "",
                    name: artist.name,
                    profilePicture: artist.profilePicture,
                  }}
                >
                  <Link
                    href={`/u/${artist.slug}`}
                    underline={false}
                    className="sidebar-media-link inline-flex min-w-0 items-center gap-1"
                    style={{ textDecoration: "none" }}
                  >
                    {!playlist && (wide || squareThumbnail) && (
                      <Avatar
                        size={16}
                        src={artist.profilePicture || "/images/D2J_Icon.png"}
                      />
                    )}
                    <Text
                      size={playlist ? "xs" : "sm"}
                      color={playlist ? "text" : "textFaded"}
                      className="max-w-full truncate"
                    >
                      {artist.name || artist.slug}
                    </Text>
                  </Link>
                </UserHoverPreview>
                {playlist && duration !== null && (
                  <span className="shrink-0 pl-2 text-xs leading-4 tabular-nums" style={{ color: colors.text }}>
                    {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
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
                  title={`${license}${backgroundUseLabel ? ` ${backgroundUseLabel}` : ""}`}
                >
                  {license}
                  {backgroundUseLabel ? ` ${backgroundUseLabel}` : ""}
                </span>
              )}
            </Vstack>
          </Hstack>

          <div
            className={
              wide
                ? "flex shrink-0 items-center gap-2"
                : "flex shrink-0 flex-col items-center gap-2"
            }
          >
            {!playlist && <Button
              size="sm"
              color="default"
              className="!h-9 !w-14 !rounded-md !p-0"
              icon={isCurrent && isPlaying ? "pause" : "play"}
              aria-label={isCurrent && isPlaying ? "Pause track" : "Play track"}
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
                aria-label="Download track"
                onClick={async () => {
                  if (!slug) return;

                  try {
                    setIsDownloading(true);
                    await downloadTrackBySlug(slug, name, pageVersion);
                  } catch (error) {
                    console.error(error);
                    addToast({ title: "Failed to download track" });
                  } finally {
                    setIsDownloading(false);
                  }
                }}
              />
            )}
          </div>
        </Hstack>

        {showRating && (
          <RatingVisibilityGate
            hiddenByPreference={hideRatings}
            hiddenText="Ratings are hidden by your settings."
            buttonSize="xs"
          >
            <Hstack className={playlist ? "gap-1 pl-12" : "justify-center gap-1 pt-2"}>
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
                          ? colors["yellow"]
                          : colors["base"],
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
                          ? colors["yellow"]
                          : colors["base"],
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
        )}
      </Vstack>
    </Card>
  );
}
