"use client";

import { Link } from "@heroui/react";
import { ReactNode, useEffect, useState } from "react";

interface IconLinkProps {
  icon: ReactNode;
  href: string;
}

export default function IconLink({ icon, href }: IconLinkProps) {
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  useEffect(() => {
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

  return (
    <Link
      href={href}
      className={`text-[#333] dark:text-white flex justify-center duration-500 ease-in-out transition-all transform ${
        !reduceMotion ? "hover:scale-125" : ""
      } transition-color`}
    >
      {icon}
    </Link>
  );
}
