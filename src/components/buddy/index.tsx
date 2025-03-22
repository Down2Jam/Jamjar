"use client";

import { Tooltip } from "@nextui-org/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Buddy() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [tooltipText, setTooltipText] = useState("Choo Choo");

  const tooltips = [
    "Choo Choo",
    "I think, therefore I train",
    "To train or not to train",
    "I have a dream... of a train",
    "Theres a train behind you",
    "Houston, we have a train",
    "When life gives you lemons, make a lemon train",
  ];

  useEffect(() => {
    setAudio(new Audio("/sounds/train.mp3")); // Change to your sound file path
  }, []);

  const handleClick = () => {
    if (audio) {
      audio.currentTime = 0; // Reset audio to start for quick repeat clicks
      audio.play();
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300); // Reset animation
  };

  const handleHover = (isOpen: boolean) => {
    if (!isOpen) return;

    const randomIndex = Math.floor(Math.random() * tooltips.length);
    setTooltipText(tooltips[randomIndex]);
  };

  return (
    <div
      className={`fixed z-50 right-2 bottom-2 hover:scale-105 hover:cursor-pointer duration-200 transition-all ${
        isAnimating ? "animate-wiggle" : ""
      }`}
      onClick={handleClick}
    >
      <Tooltip content={tooltipText} closeDelay={0} onOpenChange={handleHover}>
        <Image
          src="/images/Train.png"
          alt="Train buddy"
          width={64}
          height={64}
        />
      </Tooltip>
    </div>
  );
}
