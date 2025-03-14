"use client";

import { Button, Kbd, Tooltip } from "@nextui-org/react";
import { ReactNode, useEffect, useState } from "react";

interface ButtonActionProps {
  icon?: ReactNode;
  onPress: () => void;
  name: string;
  important?: boolean;
  tooltip?: string;
  color?: "blue" | "red" | "green" | "yellow" | "gray";
  isIconOnly?: boolean;
  size?: "sm" | "md";
  kbd?: string;
  isDisabled?: boolean;
}

export default function ButtonAction({
  icon,
  onPress,
  name,
  kbd,
  tooltip,
  color = "blue",
  isIconOnly = false,
  size = "md",
  isDisabled = false,
  important = false,
}: ButtonActionProps) {
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
          isDisabled={isDisabled}
          isIconOnly={isIconOnly}
          endContent={
            (icon || kbd) && (
              <div>
                {icon}
                {kbd && <Kbd>{kbd}</Kbd>}
              </div>
            )
          }
          className={`text-[#333] dark:text-white ${
            important
              ? color == "blue"
                ? "border-[#85bdd2] dark:border-[#1892b3] dark:bg-[#1d232b]"
                : color == "green"
                ? "border-[#a8d285] dark:border-[#18b325] dark:bg-[#1d2b21]"
                : color == "red"
                ? "border-[#d29485] dark:border-[#b31820] dark:bg-[#2b1d22]"
                : color == "yellow"
                ? "border-[#d2cd85] dark:border-[#a9b318] dark:bg-[#2b281d]"
                : "border-[#b1b1b1] dark:border-[#8f8f8f] dark:bg-[#303030]"
              : "border-[#d9d9da] dark:border-[#444] dark:bg-[#222222]"
          } bg-[#fff] transition-all transform duration-500 ease-in-out ${
            !reduceMotion
              ? size == "sm"
                ? "hover:scale-105"
                : "hover:scale-110"
              : ""
          }`}
          size={size}
          variant="bordered"
          onPress={onPress}
        >
          {name}
        </Button>
      </Tooltip>
    );
  } else {
    return (
      <Button
        isDisabled={isDisabled}
        isIconOnly={isIconOnly}
        endContent={
          (icon || kbd) && (
            <div>
              {icon}
              {kbd && <Kbd>{kbd}</Kbd>}
            </div>
          )
        }
        className={`text-[#333] dark:text-white ${
          important
            ? "border-[#85bdd2] dark:border-[#1892b3] dark:bg-[#1d232b]"
            : "border-[#d9d9da] dark:border-[#444] dark:bg-[#222222]"
        } bg-[#fff] transition-all transform duration-500 ease-in-out ${
          !reduceMotion ? "hover:scale-110" : ""
        }`}
        size={size}
        variant="bordered"
        onPress={onPress}
      >
        {name}
      </Button>
    );
  }
}
