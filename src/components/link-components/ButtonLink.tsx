"use client";

import { Button, Link, Tooltip } from "@nextui-org/react";
import { ReactNode, useEffect, useState } from "react";

interface ButtonLinkProps {
  icon?: ReactNode;
  href: string;
  name: string;
  tooltip?: string;
  isIconOnly?: boolean;
  size?: "sm" | "md";
}

export default function ButtonLink({
  icon,
  href,
  name,
  tooltip,
  isIconOnly = false,
  size = "md",
}: ButtonLinkProps) {
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

  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        <Link
          href={href}
          className={`flex justify-center duration-500 ease-in-out transition-all transform ${
            !reduceMotion ? "hover:scale-110" : ""
          }`}
        >
          <Button
            endContent={icon}
            className={`text-[#333] dark:text-white border-[#85bdd2] dark:border-[#1892b3] bg-[#fff] dark:bg-[#1d232b] transition-all transform !duration-500 ease-in-out`}
            variant="bordered"
            isIconOnly={isIconOnly}
            size={size}
          >
            {name}
          </Button>
        </Link>
      </Tooltip>
    );
  } else {
    return (
      <Link
        href={href}
        className={`flex justify-center duration-500 ease-in-out transition-all transform ${
          !reduceMotion ? "hover:scale-110" : ""
        }`}
      >
        <Button
          endContent={icon}
          className={`text-[#333] dark:text-white border-[#85bdd2] dark:border-[#1892b3] bg-[#fff] dark:bg-[#1d232b] transition-all transform !duration-500 ease-in-out`}
          variant="bordered"
          isIconOnly={isIconOnly}
          size={size}
        >
          {name}
        </Button>
      </Link>
    );
  }
}
