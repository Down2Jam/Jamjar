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
        <Link
          href={href}
          className={`flex justify-center duration-500 ease-in-out transition-all transform ${
            !reduceMotion ? "hover:scale-110" : ""
          }`}
        >
          <Button
            endContent={icon}
            className={`text-[#333] dark:text-white ${
              important
                ? "border-[#85bdd2] dark:border-[#1892b3]"
                : "border-[#8e8e8f] dark:border-[#8e8e8f]"
            } bg-[#fff] dark:bg-[#1d232b] transition-all transform !duration-500 ease-in-out`}
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
          endContent={iconPosition == "end" ? icon : undefined}
          startContent={iconPosition == "start" ? icon : undefined}
          className={`text-[#333] dark:text-white ${
            important
              ? "border-[#85bdd2] dark:border-[#1892b3] dark:bg-[#1d232b]"
              : "border-[#d9d9da] dark:border-[#8e8e8f] dark:bg-[#222222]"
          } bg-[#fff] transition-all transform !duration-500 ease-in-out`}
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
