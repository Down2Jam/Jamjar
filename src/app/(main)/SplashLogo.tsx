"use client";

import NextImage from "next/image";
import { useRef } from "react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export default function SplashLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;

    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;

    const rect = container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = -((offsetX - centerX) / centerX) * 70;
    const rotateX = ((offsetY - centerY) / centerY) * 70;

    image.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (reducedMotion) return;

    const image = imageRef.current;
    if (image) {
      image.style.transform = `rotateX(0deg) rotateY(0deg)`;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hidden lg:block perspective-[1000px]"
      style={{ width: "256px", height: "256px" }}
    >
      <NextImage
        ref={imageRef}
        src="/images/D2J_Icon.png"
        width={256}
        height={256}
        alt="D2Jam Logo"
        className={`min-h-64 min-w-64 rounded-xl ${
          reducedMotion
            ? ""
            : "transition-transform duration-300 ease-out will-change-transform"
        }`}
      />
    </div>
  );
}
