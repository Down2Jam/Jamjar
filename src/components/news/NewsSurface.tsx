"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { useTheme } from "@/providers/useSiteTheme";
import { markNewsRead } from "./news";

export default function NewsSurface({
  children,
  card = true,
}: {
  children: ReactNode;
  card?: boolean;
}) {
  const { colors } = useTheme();

  useEffect(() => {
    markNewsRead();
  }, []);

  return (
    <main
      className={`${card ? "post-card-shell px-5 sm:px-12" : "px-4 sm:px-6"} mx-auto min-h-[calc(100vh-5rem)] max-w-6xl py-6 sm:py-12`}
      style={{
        color: colors["text"],
        ...(card
          ? {
              backgroundColor: `color-mix(in srgb, ${colors["mantle"]} 98%, transparent)`,
              borderColor: `color-mix(in srgb, ${colors["text"]} 5%, transparent)`,
            }
          : {}),
        "--post-card-border": `color-mix(in srgb, ${colors["text"]} 5%, transparent)`,
        "--post-card-shadow": `color-mix(in srgb, ${colors["crust"]} 68%, transparent)`,
        "--post-action-surface": `color-mix(in srgb, ${colors["mantle"]} 70%, ${colors["crust"]})`,
        "--post-action-hover": colors["base"],
        "--reaction-red": colors["red"],
        "--reaction-orange": colors["orange"],
        "--reaction-yellow": colors["yellow"],
        "--reaction-green": colors["green"],
        "--reaction-blue": colors["blue"],
        "--reaction-purple": colors["purple"],
        "--reaction-pink": colors["pink"],
        "--reaction-gray": colors["gray"],
      } as CSSProperties}
    >
      {children}
    </main>
  );
}
