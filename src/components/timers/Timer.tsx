"use client";

import { TimerIcon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Timer({
  name,
  targetDate,
  reverse = false,
}: {
  name: string;
  targetDate: Date;
  reverse?: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(targetDate.getTime() - Date.now());
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = reverse
        ? Date.now() - targetDate.getTime()
        : targetDate.getTime() - Date.now();
      if (newTimeLeft <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, reverse]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days != 0 ? `${days} days ` : ""}${
      hours != 0 ? `${hours} hours ` : ""
    }${hours == 0 || days == 0 ? `${minutes} minutes ` : ""}${
      days == 0 && (hours == 0 || minutes == 0) ? `${seconds} seconds` : ""
    }${reverse ? " ago" : ""}`;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-4 justify-center">
        <TimerIcon className="text-[#666]" />
        <p>{name}</p>
        <p className="text-[#1687a7]">{formatTime(timeLeft)}</p>
      </div>
    </div>
  );
}
