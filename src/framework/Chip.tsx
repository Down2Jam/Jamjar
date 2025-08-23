"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import * as React from "react";

type ChipColor =
  | "default"
  | "blue"
  | "green"
  | "pink"
  | "red"
  | "yellow"
  | "gray";

export function Chip({
  children,
  color = "default",
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { color?: ChipColor }) {
  const { colors } = useTheme();

  // Base styles
  let style: React.CSSProperties = {
    backgroundColor: colors["mantle"],
    borderColor: colors["base"],
    color: colors["text"],
  };

  // Match Button color variants
  if (color === "blue") {
    style = {
      backgroundColor: colors["blueDarkDark"] + "88",
      borderColor: colors["blue"],
      color: colors["blue"],
    };
  } else if (color === "green") {
    style = {
      backgroundColor: colors["greenDarkDark"] + "88",
      borderColor: colors["green"],
      color: colors["green"],
    };
  } else if (color === "pink") {
    style = {
      backgroundColor: colors["pinkDarkDark"] + "88",
      borderColor: colors["pink"],
      color: colors["pink"],
    };
  } else if (color === "red") {
    style = {
      backgroundColor: colors["redDarkDark"] + "88",
      borderColor: colors["red"],
      color: colors["red"],
    };
  } else if (color === "yellow") {
    style = {
      backgroundColor: colors["yellowDarkDark"] + "88",
      borderColor: colors["yellow"],
      color: colors["yellow"],
    };
  } else if (color === "gray") {
    style = {
      backgroundColor: colors["grayDarkDark"] + "88",
      borderColor: colors["gray"],
      color: colors["gray"],
    };
  }

  return (
    <span
      className={[
        "inline-flex items-center text-xs gap-1 font-medium border px-2 py-0.5 transition-all duration-300 rounded-md",
        className,
      ].join(" ")}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}
