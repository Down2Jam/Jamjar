"use client";

import { Image } from "@heroui/react";
import NextImage from "next/image";
import { useEffect, useState } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import { Card } from "@/framework/Card";
import { Hstack, Vstack } from "@/framework/Stack";
import { Button } from "@/framework/Button";
import Icon from "@/framework/Icon";
import { useTheme } from "@/providers/SiteThemeProvider";
import Text from "@/framework/Text";
import { BASE_URL } from "@/requests/config";
import WaveSurfer from "wavesurfer.js";

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
  const [play, setPlay] = useState(false);
  const [audioBlob, setAudioBlob] = useState<string | null>(null);
  const [wavesurfer, setWavesurfer] = useState<null | WaveSurfer>(null);
  const { colors } = useTheme();

  const onReady = (ws: WaveSurfer) => {
    setWavesurfer(ws);
    setPlay(false);
  };

  const onPlayPause = () => {
    if (wavesurfer) {
      wavesurfer.playPause();
      setPlay(wavesurfer.isPlaying());
    }
  };

  useEffect(() => {
    async function fetchAudioBlob() {
      try {
        const response = await fetch(`${BASE_URL}/music/${song}`);
        const blob = await response.blob();
        setAudioBlob(URL.createObjectURL(blob));
      } catch (error) {
        console.error("Error fetching audio blob:", error);
      }
    }

    fetchAudioBlob();
  }, [song]); // Runs when `song` changes

  return (
    <>
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
          {/* <div className="flex flex-col gap-2 absolute z-10 pl-24 justify-between h-20 p-2 "> */}
          <Vstack
            className="absolute pointer-events-none pl-24 z-10"
            align="start"
            gap={0}
          >
            <Text size={18}>{name}</Text>
            <Text size={12}>{game}</Text>
            <Text size={16}>{artist}</Text>
          </Vstack>

          {audioBlob && (
            <div className="w-full">
              <WavesurferPlayer
                height={80}
                waveColor={colors["base"]}
                progressColor={colors["blueDark"]}
                url={audioBlob}
                onReady={onReady}
                onPlay={() => setPlay(true)}
                onPause={() => setPlay(false)}
              />
            </div>
          )}
          <Vstack>
            <Button onClick={onPlayPause}>
              <Icon name={play ? "pause" : "play"} />
            </Button>
          </Vstack>
        </Hstack>
      </Card>
    </>
  );
}
