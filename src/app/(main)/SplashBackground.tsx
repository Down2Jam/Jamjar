"use client";

import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import Image from "@/compat/next-image";

export default function HomeBackground() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const posterUrl = "/images/sitebg.png";

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
      {/* Prefer reduced motion: show the local poster only. */}
      {prefersReducedMotion ? (
        <Image
          src={posterUrl}
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
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={posterUrl}
          preload="auto"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
            userSelect: "none",
            backgroundColor: "black",
            zIndex: 1,
          }}
        >
          <source src="/videos/splash-background.mp4" type="video/mp4" />
        </video>
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
