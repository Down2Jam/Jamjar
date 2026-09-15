"use client";

import { useTheme } from "@/providers/useSiteTheme";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const BackgroundContext = createContext<(image: string | null | undefined) => void>(() => {});

// null selects stripes; undefined restores the route's default background.
export function GamePageBackground({ image }: { image: string | null }) {
  const setBackground = useContext(BackgroundContext);
  useEffect(() => {
    setBackground(image);
    return () => setBackground(undefined);
  }, [image, setBackground]);
  return null;
}

export default function PageBackground({
  children,
  defaultImage = "/images/terra-optimized.webp",
  dimBackground = true,
}: {
  children: ReactNode | ReactNode[];
  defaultImage?: string | null;
  dimBackground?: boolean;
}) {
  const { siteTheme } = useTheme();
  const isLightTheme = siteTheme.type === "Light";
  const [background, setBackground] = useState<string | null | undefined>(undefined);
  const image = background === undefined ? defaultImage : background;
  const stripeDark = siteTheme.name === "Obsidian"
    ? `color-mix(in srgb, ${siteTheme.colors.crust} 80%, black)`
    : siteTheme.colors.crust;

  return (
    <BackgroundContext.Provider value={setBackground}>
      <div className="relative isolate min-h-screen flex flex-col ease-in-out transition-color duration-500">
        <div
          // Start each background at its final opacity; only theme changes animate.
          key={image || "stripes"}
          className="fixed inset-0 z-0 pointer-events-none transition-colors duration-500"
          style={{
            backgroundColor: siteTheme.colors[image ? "crust" : "mantle"],
          }}
        >
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-[filter,opacity] duration-500 ${
              !dimBackground || !image
                ? "opacity-100"
                : isLightTheme
                ? "opacity-[0.72] sm:opacity-[0.78]"
                : "opacity-30 sm:opacity-40"
            }`}
            style={{
              backgroundImage: image
                ? `url(${JSON.stringify(image)})`
                : `repeating-linear-gradient(135deg, ${siteTheme.colors.mantle} 0px, ${siteTheme.colors.mantle} 40px, ${stripeDark} 40px, ${stripeDark} 80px)`,
              filter: !dimBackground ? "none" : !image ? "brightness(0.75)" : isLightTheme
                ? "brightness(1.02) saturate(0.8) contrast(0.9)"
                : "brightness(0.68) saturate(0.72) contrast(0.92)",
              transform: image ? "scale(1.01)" : undefined,
            }}
          />
        </div>
        {children}
      </div>
    </BackgroundContext.Provider>
  );
}
