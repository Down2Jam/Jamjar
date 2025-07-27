"use client";

import { useState, useEffect } from "react";

// Tailwind breakpoints in ascending order
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export default function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    handleResize(); // initial
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    height: typeof window !== "undefined" ? window.innerHeight : 0,

    // Tailwind-style flags
    isSm: width >= breakpoints.sm && width < breakpoints.md,
    isMd: width >= breakpoints.md && width < breakpoints.lg,
    isLg: width >= breakpoints.lg && width < breakpoints.xl,
    isXl: width >= breakpoints.xl && width < breakpoints["2xl"],
    is2xl: width >= breakpoints["2xl"],
    isMobile: width < breakpoints.sm,

    // "Up" flags (current or larger)
    isSmUp: width >= breakpoints.sm,
    isMdUp: width >= breakpoints.md,
    isLgUp: width >= breakpoints.lg,
    isXlUp: width >= breakpoints.xl,
    is2xlUp: width >= breakpoints["2xl"],

    // "Down" flags (strictly below next)
    isSmDown: width < breakpoints.md,
    isMdDown: width < breakpoints.lg,
    isLgDown: width < breakpoints.xl,
    isXlDown: width < breakpoints["2xl"],
  };
}
