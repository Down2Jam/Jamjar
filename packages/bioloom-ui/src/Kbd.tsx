"use client";

import * as React from "react";
import { useTheme } from "./theme";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  size?: "xs" | "sm" | "md";
}

export function Kbd({
  size = "sm",
  className = "",
  style,
  children,
  ...props
}: KbdProps) {
  const { colors } = useTheme();

  const sizeClasses: Record<NonNullable<KbdProps["size"]>, string> = {
    xs: "text-[9px] px-1 py-0.5",
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
  };

  return (
    <kbd
      className={[
        "inline-flex items-center justify-center rounded border font-mono uppercase",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: colors["mantle"],
        borderColor: colors["base"],
        color: colors["text"],
        ...style,
      }}
      {...props}
    >
      {children}
    </kbd>
  );
}
