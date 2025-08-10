"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  style?: React.CSSProperties;
}

export function Card({ children, className = "", style, ...props }: CardProps) {
  const { colors } = useTheme();

  return (
    <div
      className={[
        "rounded-xl border shadow-md transition-colors duration-500 p-4",
        className,
      ].join(" ")}
      style={{
        backgroundColor: colors["mantle"],
        borderColor: colors["base"],
        color: colors["text"],
        ...style, // merge custom styles last so they override defaults
      }}
      {...props}
    >
      {children}
    </div>
  );
}
