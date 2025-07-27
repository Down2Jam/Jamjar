"use client";

import { useState } from "react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import Image from "next/image";

export default function HomeBackground() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const VIDEO_ID = "LybT6z9lcJU";
  const iframeUrl = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${VIDEO_ID}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        zIndex: 0,
        backgroundColor: "black",
      }}
    >
      {/* Prefer reduced motion: show static thumbnail only */}
      {prefersReducedMotion ? (
        <Image
          src={thumbnailUrl}
          alt="Background still frame"
          fill
          priority
          style={{
            objectFit: "cover",
            userSelect: "none",
            pointerEvents: "none",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
      ) : (
        <>
          {/* Render iframe only after it's loaded, fade it in */}
          <iframe
            src={iframeUrl}
            allow="autoplay"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "177.78vh",
              height: "100vh",
              transform: "translate(-50%, -50%)",
              minWidth: "100vw",
              minHeight: "56.25vw",
              pointerEvents: "none",
              userSelect: "none",
              border: "none",
              opacity: iframeLoaded ? 1 : 0,
              transition: "opacity 0.3s ease",
              backgroundColor: "black",
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Always show dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}
