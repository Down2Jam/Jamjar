"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import { Button, Kbd, Tooltip } from "@heroui/react";
import { ReactNode } from "react";

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
  iconPosition?: "start" | "end";
  isDisabled?: boolean;
}

export default function ButtonAction({
  icon,
  onPress,
  name,
  kbd,
  tooltip,
  isIconOnly = false,
  size = "md",
  iconPosition = "end",
  isDisabled = false,
}: ButtonActionProps) {
  const { siteTheme } = useTheme();

  if (tooltip) {
    return (
      <Tooltip content={tooltip} className="text-[#333] dark:text-white">
        <Button
          isDisabled={isDisabled}
          isIconOnly={isIconOnly}
          startContent={iconPosition == "start" ? icon : undefined}
          endContent={
            (icon || kbd) && (
              <div>
                {iconPosition == "end" && icon}
                {kbd && <Kbd>{kbd}</Kbd>}
              </div>
            )
          }
          style={{
            backgroundColor: siteTheme.colors["mantle"],
            color: siteTheme.colors["text"],
            borderColor: siteTheme.colors["base"],
          }}
          className={`transition-all transform duration-500 ease-in-out`}
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
        startContent={iconPosition == "start" ? icon : undefined}
        endContent={
          (icon || kbd) && (
            <div>
              {iconPosition == "end" && icon}
              {kbd && <Kbd>{kbd}</Kbd>}
            </div>
          )
        }
        className={`transition-all transform duration-500 ease-in-out`}
        style={{
          backgroundColor: siteTheme.colors["mantle"],
          color: siteTheme.colors["text"],
          borderColor: siteTheme.colors["base"],
        }}
        size={size}
        variant="bordered"
        onPress={onPress}
      >
        {name}
      </Button>
    );
  }
}
