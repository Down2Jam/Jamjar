"use client";

import { useTheme } from "@/providers/useSiteTheme";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const BackgroundImageContext = createContext<(image: string | null) => void>(() => {});

export function useGamePageBackground(image?: string | null) {
  const setImage = useContext(BackgroundImageContext);
  useEffect(() => {
    setImage(image || null);
    return () => setImage(null);
  }, [image, setImage]);
}

export default function PageBackground({
  children,
  plain = false,
  game = false,
}: {
  children: ReactNode | ReactNode[];
  plain?: boolean;
  game?: boolean;
}) {
  const { siteTheme } = useTheme();
  const isLightTheme = siteTheme.type === "Light";
  const [gameImage, setGameImage] = useState<string | null>(null);

  return (
    <BackgroundImageContext.Provider value={setGameImage}>
    <div className="relative isolate min-h-screen flex flex-col ease-in-out transition-color duration-500" style={plain ? { color: siteTheme.colors.text } : undefined}>
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-colors duration-500"
        style={{
          backgroundColor: siteTheme.colors.crust,
        }}
      >
        {!plain && game && !gameImage ? <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `repeating-linear-gradient(135deg, ${siteTheme.colors.blue} 0px, ${siteTheme.colors.blue} 40px, ${siteTheme.colors.purple} 40px, ${siteTheme.colors.purple} 80px)` }}
        /> : !plain && <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-[filter,opacity] duration-500 ${
            isLightTheme
              ? "opacity-[0.72] sm:opacity-[0.78]"
              : "opacity-30 sm:opacity-40"
          }`}
          style={{
            backgroundImage: `url(${JSON.stringify(game && gameImage ? gameImage : "/images/terra.png")})`,
            filter: isLightTheme
              ? "brightness(1.02) saturate(0.8) contrast(0.9)"
              : "brightness(0.68) saturate(0.72) contrast(0.92)",
            transform: "scale(1.01)",
          }}
        />}
      </div>
      {children}
    </div>
    </BackgroundImageContext.Provider>
  );
}
