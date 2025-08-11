"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import * as React from "react";

export function Badge({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const { colors } = useTheme();

  return (
    <span
      className={[
        "inline-flex items-center text-xs gap-1 font-medium border px-2 py-0.5 transition-all duration-300 rounded-md",
        className,
      ].join(" ")}
      style={{
        backgroundColor: colors["mantle"],
        borderColor: colors["base"],
        color: colors["text"],
      }}
      {...props}
    >
      {children}
    </span>
  );
}
