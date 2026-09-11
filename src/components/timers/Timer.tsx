"use client";

import { Text } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { TimerIcon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Timer({
  name,
  targetDate,
  reverse = false,
  size = "md",
}: {
  name: string;
  targetDate: Date;
  reverse?: boolean;
  size?: "xs" | "sm" | "md";
}) {
  const [timeLeft, setTimeLeft] = useState(targetDate.getTime() - Date.now());
  const [mounted, setMounted] = useState<boolean>(false);
  const { siteTheme } = useTheme();
  const iconSize = size === "xs" ? 18 : size === "sm" ? 20 : 24;

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
    const parts: string[] = [];

    if (days !== 0) {
      parts.push(`${days} day${days === 1 ? "" : "s"}`);
      if (hours !== 0) {
        parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
      } else if (minutes !== 0) {
        parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
      }
    } else if (hours !== 0) {
      parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
      parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
    } else if (minutes !== 0) {
      parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
      parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
    } else {
      parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
    }

    return `${parts.join(" ")}${reverse ? " ago" : ""}`;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <div
        className={`flex items-center justify-center ${
          size === "xs" ? "gap-2" : size === "sm" ? "gap-3" : "gap-4"
        }`}
      >
        <TimerIcon
          size={iconSize}
          style={{
            color: siteTheme.colors["textFaded"],
          }}
        />
        <Text size={size} className="whitespace-nowrap">{name}</Text>
        <Text size={size} color="blue" className="whitespace-nowrap">
          {formatTime(timeLeft)}
        </Text>
      </div>
    </div>
  );
}
