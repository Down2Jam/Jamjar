"use client";

import { Button, Link, Tooltip } from "@nextui-org/react";
import { ReactNode, useEffect, useState } from "react";

interface ButtonLinkProps {
  icon?: ReactNode;
  href: string;
  name: string;
  tooltip?: string;
  color?: "blue" | "red" | "green" | "yellow" | "gray";
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
  color = "blue",
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
              ? color == "blue"
                ? "border-[#85bdd2] bg-[#c0d9e2] dark:border-[#1892b3] dark:bg-[#1d232b]"
                : color == "green"
                ? "border-[#a8d285] bg-[#d1e5c2] dark:border-[#18b325] dark:bg-[#1d2b21]"
                : color == "red"
                ? "border-[#d29485] bg-[#e4c4bc] dark:border-[#b31820] dark:bg-[#2b1d22]"
                : color == "yellow"
                ? "border-[#d2cd85] bg-[#dfdcb7] dark:border-[#a9b318] dark:bg-[#2b281d]"
                : "border-[#b1b1b1] bg-[#d4d4d4] dark:border-[#8f8f8f] dark:bg-[#303030]"
              : "border-[#d9d9da] bg-white dark:border-[#444] dark:bg-[#222222]"
          } transition-all transform duration-500 ease-in-out ${
            !reduceMotion
              ? size == "sm"
                ? "hover:scale-105"
                : "hover:scale-110"
              : ""
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
            ? color == "blue"
              ? "border-[#85bdd2] bg-[#c0d9e2] dark:border-[#1892b3] dark:bg-[#1d232b]"
              : color == "green"
              ? "border-[#a8d285] bg-[#d1e5c2] dark:border-[#18b325] dark:bg-[#1d2b21]"
              : color == "red"
              ? "border-[#d29485] bg-[#e4c4bc] dark:border-[#b31820] dark:bg-[#2b1d22]"
              : color == "yellow"
              ? "border-[#d2cd85] bg-[#dfdcb7] dark:border-[#a9b318] dark:bg-[#2b281d]"
              : "border-[#b1b1b1] bg-[#d4d4d4] dark:border-[#8f8f8f] dark:bg-[#303030]"
            : "border-[#d9d9da] bg-white dark:border-[#444] dark:bg-[#222222]"
        } transition-all transform duration-500 ease-in-out ${
          !reduceMotion
            ? size == "sm"
              ? "hover:scale-105"
              : "hover:scale-110"
            : ""
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
