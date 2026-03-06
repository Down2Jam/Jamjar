"use client";

import { Card } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { useMusic } from "bioloom-miniplayer";
import Image from "next/image";
import { Link } from "bioloom-ui";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";

interface SidebarSongProps {
  name: string;
  artist: UserType;
  thumbnail: string;
  song: string;
  game: GameType;
  license?: string | null;
  allowDownload?: boolean;
}

export default function SidebarSong({
  name,
  thumbnail,
  song,
  game,
  artist,
  license,
  allowDownload,
}: SidebarSongProps) {
  const { playItem } = useMusic();

  return (
    <Card>
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
            <Text>{name}</Text>
            <Link href={`/g/${game.slug}`} underline={false}>
              <Text size="xs" color="textFaded">
                {game.name}
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
              </Text>
            )}
          </Vstack>
        </Hstack>

        <Vstack>
          <Button
            onClick={() => playItem({ name, artist, thumbnail, game, song })}
          >
            <Icon name="play" />
          </Button>
          {allowDownload && (
            <Button
              size="xs"
              variant="ghost"
              href={song}
              download
              icon="download"
            >
              Download
            </Button>
          )}
        </Vstack>
      </Hstack>
    </Card>
  );
}
