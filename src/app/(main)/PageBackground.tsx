"use client";

import { useTheme } from "@/providers/useSiteTheme";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const siteBackground = "/images/terra-optimized.webp";
const BackgroundContext = createContext<(image: string | null | undefined) => void>(() => {});

export function GamePageBackground({ image }: { image: string | null }) {
  const setBackground = useContext(BackgroundContext);
  useEffect(() => {
    setBackground(image);
    return () => setBackground(undefined);
  }, [image, setBackground]);
  return null;
}

export default function PageBackground({ children, plain = false, fade = false, defaultImage = siteBackground, dimBackground = true }: {
  children: ReactNode | ReactNode[];
  plain?: boolean;
  fade?: boolean;
  defaultImage?: string | null;
  dimBackground?: boolean;
}) {
  const { siteTheme } = useTheme();
  const [background, setBackground] = useState<string | null | undefined>();
  const image = background === undefined ? defaultImage : background;
  const isLightTheme = siteTheme.type === "Light";
  const imageOpacity = !dimBackground || !image || fade
    ? "opacity-100"
    : isLightTheme ? "opacity-[0.72] sm:opacity-[0.78]" : "opacity-30 sm:opacity-40";
  const imageFilter = !dimBackground ? "none" : !image ? "brightness(0.75)" : fade
    ? isLightTheme ? "brightness(0.9)" : "brightness(0.78)"
    : isLightTheme
    ? "brightness(1.02) saturate(0.8) contrast(0.9)"
    : "brightness(0.68) saturate(0.72) contrast(0.92)";

  const stripeDark = siteTheme.name === "Obsidian"
    ? `color-mix(in srgb, ${siteTheme.colors.crust} 80%, black)`
    : siteTheme.colors.crust;

  return <BackgroundContext.Provider value={setBackground}>
    <div className="relative isolate min-h-screen flex flex-col" style={{ backgroundColor: fade && !plain ? "#000" : undefined }}>
      {fade ? (!plain && <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {image && <img
          src={image}
          alt=""
          referrerPolicy="no-referrer"
          style={{ filter: imageFilter }}
          className={`relative left-1/2 block h-auto w-full min-w-[1542px] max-w-none -translate-x-1/2 [mask-image:linear-gradient(to_bottom,black_0%,black_58%,rgb(0_0_0_/_96%)_64%,rgb(0_0_0_/_84%)_70%,rgb(0_0_0_/_64%)_76%,rgb(0_0_0_/_40%)_82%,rgb(0_0_0_/_18%)_88%,rgb(0_0_0_/_4%)_94%,transparent_99%,transparent_100%)] ${imageOpacity}`}
        />}
        {dimBackground && <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_calc(50%_-_760px),rgb(0_0_0_/_45%)_calc(50%_-_600px),rgb(0_0_0_/_45%)_calc(50%_+_600px),transparent_calc(50%_+_760px))]" />}
      </div>) : (
        <div
          // Start each background at its final opacity; only theme changes animate.
          key={image || "stripes"}
          className="fixed inset-0 z-0 pointer-events-none transition-colors duration-500"
          style={{
            backgroundColor: siteTheme.colors[image ? "crust" : "mantle"],
          }}
        >
          {!plain && <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-[filter,opacity] duration-500 ${imageOpacity}`}
            style={{
              backgroundImage: image
                ? `url(${JSON.stringify(image)})`
                : `repeating-linear-gradient(135deg, ${siteTheme.colors.mantle} 0px, ${siteTheme.colors.mantle} 40px, ${stripeDark} 40px, ${stripeDark} 80px)`,
              filter: imageFilter,
              transform: image ? "scale(1.01)" : undefined,
            }}
          />}
        </div>
      )}
      {children}
    </div>
  </BackgroundContext.Provider>;
}
