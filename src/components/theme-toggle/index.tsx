"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const handleToggle = () => {
    if (isSpinning) return;

    if (!reduceMotion) {
      setIsSpinning(true);
      setTimeout(() => setIsSpinning(false), 500);
    }

    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`border-[#d9d9da] dark:border-[#444] dark:bg-[#222222] bg-[#fff] border-2 rounded-xl text-[#333] dark:text-white ${
        !reduceMotion ? "hover:scale-[115%]" : ""
      } transform !duration-250 !ease-linear !transition-all`}
    >
      <div
        onClick={handleToggle}
        style={{ cursor: "pointer" }}
        className={`p-[6px] ${
          isSpinning && !reduceMotion ? "animate-[spin_0.5s_ease-out]" : ""
        }`}
      >
        {resolvedTheme === "dark" && <Moon />}
        {resolvedTheme === "light" && <Sun />}
      </div>
    </div>
  );
}
