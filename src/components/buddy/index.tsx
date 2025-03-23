"use client";

import { Tooltip } from "@nextui-org/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Buddy() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [tooltipText, setTooltipText] = useState("Choo Choo");
  const [lastTooltipIndex, setLastTooltipIndex] = useState<number | null>(null);

  const tooltips = [
    "Choo Choo",
    "I think, therefore I train",
    "To train or not to train",
    "I have a dream... of a train",
    "Theres a train behind you",
    "Houston, we have a train",
    "When life gives you lemons, make a lemon train",
    "You are the 1000th visitor, click here for a surprise",
    "Its dangerous to go alone! Take this train",
    "Train... Train never changes",
    "The train is out there",
    "You have died of Train",
    "Do a train roll",
    "Are you training, son?",
    "I've got a train feeling about this",
    "I choose train",
    "Shall we train?",
    "You're already Train",
    "Give me train or give me death",
    "The train is a lie",
    "I like trains",
    "The answer is train",
    "I have Siderodromophobia",
    "Theres a train in my train",
    "Insert train related sentence here",
    "One small step for train, one giant step for trainkind",
    "The last trainbender",
    "In train we trust",
    "Press F to train",
    "The train will remember that",
    "What would a train do?",
    "You can do it",
    "The first train was invented in 66,000,000 B.C.",
    "I believe in you",
    "You got this",
    "Danger: Train nearby",
    "Nature naturally evolves into train",
    "There are at least 2 trains in the world",
    "There are 5 spiders living in the average train",
    "Every day I'm training",
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

    if (Math.random() < 0.001) {
      setTooltipText("🚂");
    } else {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * tooltips.length);
      } while (randomIndex === lastTooltipIndex); // Ensure a different tooltip is chosen

      setLastTooltipIndex(randomIndex);
      setTooltipText(tooltips[randomIndex]);
    }
  };

  return (
    <div
      className={`fixed z-50 right-2 bottom-2 hover:scale-105 hover:cursor-pointer duration-200 transition-all ${
        isAnimating ? "animate-wiggle" : ""
      }`}
      onClick={handleClick}
    >
      <Tooltip
        content={tooltipText}
        closeDelay={0}
        onOpenChange={handleHover}
        className="text-[#333] dark:text-white"
      >
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
