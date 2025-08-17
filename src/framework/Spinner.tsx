"use client";

import { Loader2 } from "lucide-react";
import { useTheme } from "@/providers/SiteThemeProvider";

interface SpinnerProps {
  size?: number;
  color?: "text";
  className?: string;
}

export function Spinner({
  size = 16,
  color = "text",
  className = "",
}: SpinnerProps) {
  const { colors } = useTheme();

  return (
    <Loader2
      size={size}
      className={`animate-spin ${className}`}
      style={{ color: colors[color] }}
    />
  );
}
