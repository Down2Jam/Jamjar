"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";

interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  content?: React.ReactNode;
  size?: number;
  color?: "default" | "blue" | "green" | "red" | "yellow" | "pink";
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  offset?: number;
}

export function Badge({
  children,
  content,
  size = 16,
  color = "default",
  position = "top-right",
  offset = 0,
  className = "",
  style,
  ...props
}: BadgeProps) {
  const { colors } = useTheme();

  const positionStyle = {
    "top-right": {
      top: offset,
      right: offset,
      transform: "translate(50%, -50%)",
    },
    "top-left": {
      top: offset,
      left: offset,
      transform: "translate(-50%, -50%)",
    },
    "bottom-right": {
      bottom: offset,
      right: offset,
      transform: "translate(50%, 50%)",
    },
    "bottom-left": {
      bottom: offset,
      left: offset,
      transform: "translate(-50%, 50%)",
    },
  }[position];

  const colorMap = {
    default: {
      backgroundColor: colors.mantle,
      color: colors.text,
      borderColor: colors.base,
    },
    blue: {
      backgroundColor: colors.blue,
      color: colors.blueLight,
      borderColor: colors.blueDark,
    },
    green: {
      backgroundColor: colors.green,
      color: colors.greenLight,
      borderColor: colors.greenDark,
    },
    red: {
      backgroundColor: colors.red,
      color: colors.redLight,
      borderColor: colors.redDark,
    },
    yellow: {
      backgroundColor: colors.yellow,
      color: colors.yellowDark,
      borderColor: colors.yellow,
    },
    pink: {
      backgroundColor: colors.pink,
      color: colors.pinkLight,
      borderColor: colors.pinkDark,
    },
  };

  return (
    <div
      className={`relative ${className}`}
      style={{
        lineHeight: 0,
        ...style,
      }}
      {...props}
    >
      {children}
      {content !== undefined && (
        <div
          className="absolute flex items-center justify-center rounded-full text-[10px] font-bold border"
          style={{
            width: size,
            height: size,
            ...colorMap[color],
            ...positionStyle,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
