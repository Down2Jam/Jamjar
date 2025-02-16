"use client";

import { Button, Image } from "@nextui-org/react";
import NextImage from "next/image";
import ButtonAction from "../link-components/ButtonAction";
import {
  ExternalLink,
  MoreHorizontal,
  PauseCircleIcon,
  PlayCircle,
  PlayCircleIcon,
  StopCircleIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WavesurferPlayer from "@wavesurfer/react";

interface SidebarSongProps {
  name: string;
  artist: string;
  thumbnail: string;
  song: string;
  format: string;
  game: string;
}

export default function SidebarSong({
  name,
  artist,
  thumbnail,
  song,
  format,
  game,
}: SidebarSongProps) {
  const songRef = useRef<HTMLAudioElement>(null);
  const [play, setPlay] = useState(false);
  const visualizerRef = useRef<HTMLCanvasElement>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [wavesurfer, setWavesurfer] = useState(null);

  const onReady = (ws) => {
    setWavesurfer(ws);
    setPlay(false);
  };

  const onPlayPause = () => {
    wavesurfer && wavesurfer.playPause();
  };

  useEffect(() => {
    async function fetchAudioBlob() {
      try {
        const response = await fetch(song);
        const blob = await response.blob();
        setAudioBlob(blob);
      } catch (error) {
        console.error("Error fetching audio blob:", error);
      }
    }

    fetchAudioBlob();
  }, [song]); // Runs when `song` changes

  return (
    <>
      <div className="border border-[#85bdd2] dark:border-[#1892b3] bg-[#fff] dark:bg-[#1d232b] rounded-xl p-4 flex gap-3">
        <Image
          as={NextImage}
          src={thumbnail}
          width={80}
          height={80}
          className="z-0 min-w-20 min-h-20 max-w-20 max-h-20"
          alt="Song Thumbnail"
        />
        <div className="flex flex-col gap-2 absolute z-10 pl-24 justify-between h-20 p-2">
          <p className="text-2xl">{name}</p>
          <p>{game}</p>
        </div>
        <div className="w-full">
          <WavesurferPlayer
            height={80}
            waveColor="#bb4481"
            url={song}
            onReady={onReady}
            onPlay={() => setPlay(true)}
            onPause={() => setPlay(false)}
          />
        </div>
      </div>
    </>
  );
}
