"use client";

import { Card } from "@/framework/Card";
import { Hstack, Vstack } from "@/framework/Stack";
import { Button } from "@/framework/Button";
import Icon from "@/framework/Icon";
import Text from "@/framework/Text";
import { useMusic } from "@/providers/MusicProvider";
import Image from "next/image";
import { Link } from "@/framework/Link";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";

interface SidebarSongProps {
  name: string;
  artist: UserType;
  thumbnail: string;
  song: string;
  game: GameType;
}

export default function SidebarSong({
  name,
  thumbnail,
  song,
  game,
  artist,
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
          </Vstack>
        </Hstack>

        <Vstack>
          <Button
            onClick={() => playItem({ name, artist, thumbnail, game, song })}
          >
            <Icon name="play" />
          </Button>
        </Vstack>
      </Hstack>
    </Card>
  );
}
