"use client";

import { Card } from "bioloom-ui";
import { addToast } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Text } from "bioloom-ui";
import {
  type TrackComposer,
  type TrackGame,
  useMusic,
} from "bioloom-miniplayer";
import Image from "@/compat/next-image";
import { Link } from "bioloom-ui";
import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { useTheme } from "@/providers/useSiteTheme";
import { downloadTrackBySlug } from "@/helpers/trackDownload";
import { Star } from "lucide-react";
import { useState } from "react";

interface SidebarSongProps {
  slug?: string;
  trackId?: number;
  name: string;
  artist: TrackComposer;
  thumbnail: string;
  song: string;
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
}

export default function SidebarSong({
  slug,
  trackId,
  name,
  thumbnail,
  song,
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
}: SidebarSongProps) {
  const { playItem } = useMusic();
  const { colors } = useTheme();
  const [hoverValue, setHoverValue] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const displayValue = hoverValue || ratingValue;
  const backgroundUseLabel = allowBackgroundUse
    ? allowBackgroundUseAttribution
      ? "(Stream safe, credit)"
      : "(Stream safe)"
    : null;

  return (
    <Card>
      <Vstack align="stretch" gap={2}>
        <Hstack justify="between">
          <Hstack>
            <Image
              src={thumbnail}
              width={90}
              height={50}
              className="z-0 min-w-[90px] min-h-[50px] max-w-[90px] max-h-[50px] object-cover rounded"
              alt="Song Thumbnail"
            />
            <Vstack className="z-10" align="start" gap={0}>
              <Link
                href={
                  slug
                    ? `/m/${slug}${pageVersion ? `?pageVersion=${pageVersion}` : ""}`
                    : `/g/${game.slug}${pageVersion ? `?pageVersion=${pageVersion}` : ""}`
                }
                underline={false}
              >
                <Text>{name}</Text>
              </Link>
              <Link
                href={`/g/${game.slug}${pageVersion ? `?pageVersion=${pageVersion}` : ""}`}
                underline={false}
              >
                <Text size="xs" color="textFaded">
                  {game.name}
                  {pageVersion === "POST_JAM" ? " · Post-Jam" : pageVersion === "JAM" ? " · Jam" : ""}
                </Text>
              </Link>
              <Link href={`/u/${artist.slug}`} underline={false}>
                <Text size="sm" color="textFaded">
                  {artist.name || artist.slug}
                </Text>
              </Link>
              {license && (
                <Text size="xs" color="textFaded">
                  License: {license}
                  {backgroundUseLabel ? ` ${backgroundUseLabel}` : ""}
                </Text>
              )}
            </Vstack>
          </Hstack>

          <Vstack>
            <Button
              onClick={() =>
                playItem({ slug, name, artist, thumbnail, game, song })
              }
            >
              <Icon name="play" />
            </Button>
            {allowDownload && (
              <Button
                size="xs"
                variant="ghost"
                loading={isDownloading}
                icon="download"
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
              >
                Download
              </Button>
            )}
          </Vstack>
        </Hstack>

        {showRating && (
          <RatingVisibilityGate
            hiddenByPreference={hideRatings}
            hiddenText="Ratings are hidden by your settings."
            buttonSize="xs"
          >
            <Hstack className="justify-center gap-1 pt-2">
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
