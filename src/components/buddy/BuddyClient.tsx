"use client";

import useBreakpoint from "@/hooks/useBreakpoint";
import useHasMounted from "@/hooks/useHasMounted";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function BuddyClient({ tooltips }: { tooltips: string[] }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement[]>([]);
  const { isMobile } = useBreakpoint();
  const hasMounted = useHasMounted();

  useEffect(() => {
    setAudio(tooltips.map((tooltip) => new Audio(`/sounds/${tooltip}.wav`)));
  }, [tooltips]);

  const handleClick = () => {
    const rand_audio = audio[Math.floor(Math.random() * audio.length)];

    if (rand_audio) {
      rand_audio.currentTime = 0;
      rand_audio.play();
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (!hasMounted) {
    return <></>;
  }

  return (
    <div
      className={`${
        isMobile ? "hidden" : "fixed"
      } z-50 right-2 bottom-2 hover:scale-105 hover:cursor-pointer duration-200 transition-all ${
        isAnimating ? "animate-wiggle" : ""
      }`}
      onClick={handleClick}
    >
      <Image
        src="/images/pfp_dood.jpg"
        alt="Buddy"
        width={48}
        height={48}
        style={{
          transform: "scale(-1, 1)",
        }}
      />
    </div>
  );
}
