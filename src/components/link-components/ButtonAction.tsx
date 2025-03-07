"use client";

import { Button, Kbd } from "@nextui-org/react";
import { ReactNode, useEffect, useState } from "react";

interface ButtonActionProps {
  icon?: ReactNode;
  onPress: () => void;
  name: string;
  important?: boolean;
  kbd?: string;
  isDisabled?: boolean;
}

export default function ButtonAction({
  icon,
  onPress,
  name,
  kbd,
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

  return (
    <Button
      isDisabled={isDisabled}
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
      variant="bordered"
      onPress={onPress}
    >
      {name}
    </Button>
  );
}
