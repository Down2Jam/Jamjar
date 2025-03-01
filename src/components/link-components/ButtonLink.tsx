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
  iconPosition?: "start" | "end";
  important?: boolean;
}

export default function ButtonLink({
  icon,
  href,
  name,
  tooltip,
  isIconOnly = false,
  size = "md",
  iconPosition = "end",
  important = false,
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
        <Button
          endContent={icon}
          className={`text-[#333] dark:text-white ${
            important
              ? "border-[#85bdd2] dark:border-[#1892b3]"
              : "border-[#d9d9da] dark:border-[#444]"
          } bg-[#fff] dark:bg-[#1d232b] transition-all transform !duration-500 ease-in-out ${
            !reduceMotion ? "hover:scale-110" : ""
          }`}
          variant="bordered"
          isIconOnly={isIconOnly}
          size={size}
          href={href}
          as={Link}
        >
          {name}
        </Button>
      </Tooltip>
    );
  } else {
    return (
      <Button
        endContent={iconPosition == "end" ? icon : undefined}
        startContent={iconPosition == "start" ? icon : undefined}
        className={`text-[#333] dark:text-white ${
          important
            ? "border-[#85bdd2] dark:border-[#1892b3] dark:bg-[#1d232b]"
            : "border-[#d9d9da] dark:border-[#444] dark:bg-[#222222]"
        } bg-[#fff] transition-all transform !duration-500 ease-in-out ${
          !reduceMotion ? "hover:scale-110" : ""
        }`}
        variant="bordered"
        isIconOnly={isIconOnly}
        size={size}
        href={href}
        as={Link}
      >
        {name}
      </Button>
    );
  }
}
