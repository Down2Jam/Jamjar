"use client";

import * as React from "react";
import { useTheme } from "./theme";

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  thickness?: number;
  length?: number | string;
}

export function Divider({
  orientation = "horizontal",
  thickness = 1,
  length,
  className = "",
  style,
  ...props
}: DividerProps) {
  const { colors } = useTheme();
  const isVertical = orientation === "vertical";

  const resolvedLength =
    typeof length === "number" ? `${length}px` : length ?? undefined;

  const mergedStyle: React.CSSProperties = {
    backgroundColor: colors["base"],
    width: isVertical ? thickness : resolvedLength ?? "100%",
    height: isVertical ? resolvedLength ?? "100%" : thickness,
    ...style,
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={["shrink-0", className].filter(Boolean).join(" ")}
      style={mergedStyle}
      {...props}
    />
  );
}
