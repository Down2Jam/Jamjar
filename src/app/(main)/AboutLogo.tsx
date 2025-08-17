"use client";

import { useRef } from "react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import Logo from "@/components/logo";

export default function AboutLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<SVGSVGElement>(null);
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
      className="perspective-[1000px]"
      style={{ width: "320px", height: "320px" }}
    >
      <Logo
        ref={imageRef}
        className={`min-h-80 min-w-80 rounded-xl ${
          reducedMotion
            ? ""
            : "transition-transform duration-300 ease-out will-change-transform"
        }`}
      />
    </div>
  );
}
