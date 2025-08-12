"use client";

import { Image } from "@heroui/react";
import NextImage from "next/image";
import { Card } from "@/framework/Card";
import { Hstack, Vstack } from "@/framework/Stack";
import { Button } from "@/framework/Button";
import Icon from "@/framework/Icon";
import Text from "@/framework/Text";
import { useMusic } from "@/providers/MusicProvider";

interface SidebarSongProps {
  name: string;
  artist: string;
  thumbnail: string;
  song: string;
  game: string;
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
      <Hstack>
        <Image
          as={NextImage}
          src={thumbnail}
          width={80}
          height={80}
          className="z-0 min-w-20 min-h-20 max-w-20 max-h-20"
          alt="Song Thumbnail"
        />
        <Vstack
          className="absolute pointer-events-none pl-24 z-10"
          align="start"
          gap={0}
        >
          <Text size={18}>{name}</Text>
          <Text size={12}>{game}</Text>
          <Text size={16}>{artist}</Text>
        </Vstack>

        <div className="w-full"></div>

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
