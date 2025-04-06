"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function BackgroundFade() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      className={`absolute inset-0 min-h-screen bg-repeat-y bg-[repeating-linear-gradient(135deg,#075e94_0px,#075e94_40px,#4a3279_40px,#4a3279_80px)]`}
      initial={{
        opacity: 0,
        backgroundPosition: reducedMotion ? "0% 0%" : "0% 20%",
      }}
      animate={{
        opacity: resolvedTheme === "dark" ? 0.1 : 0.05,
        backgroundPosition: "0% 0%",
      }}
      transition={{
        duration: 2,
        ease: "easeOut",
        type: "spring",
        opacity: { duration: 0.5 },
      }}
      style={{
        backgroundSize: "100% 340px",
      }}
    />
  );
}
