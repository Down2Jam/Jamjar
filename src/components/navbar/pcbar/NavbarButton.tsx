import { Link } from "@heroui/link";
import { NavbarItem } from "@heroui/navbar";
import { Button } from "@heroui/button";
import { ReactNode } from "react";
import Hotkey from "../../hotkey";
import NavbarTooltip from "./NavbarTooltip";

interface NavbarButtonProps {
  icon?: ReactNode;
  href?: string;
  name: string;
  isIconOnly?: boolean;
  description: string;
  hotkey?: string[];
  color?: "blue" | "yellow" | "green" | "lime" | "orange" | "red";
  onPress?: () => void;
  className?: string;
}

function colorToTextHover(
  color: "blue" | "yellow" | "green" | "lime" | "orange" | "red"
) {
  switch (color) {
    case "blue":
      return "hover:text-blue-800 dark:hover:text-blue-200";
    case "yellow":
      return "hover:text-yellow-800 dark:hover:text-yellow-200";
    case "green":
      return "hover:text-green-800 dark:hover:text-green-200";
    case "lime":
      return "hover:text-lime-800 dark:hover:text-lime-200";
    case "orange":
      return "hover:text-orange-800 dark:hover:text-orange-200";
    case "red":
      return "hover:text-red-800 dark:hover:text-red-300";
  }
}

function colorToText(
  color: "blue" | "yellow" | "green" | "lime" | "orange" | "red"
) {
  switch (color) {
    case "blue":
      return "text-blue-900 dark:text-blue-300";
    case "yellow":
      return "text-yellow-900 dark:text-yellow-300";
    case "green":
      return "text-green-900 dark:text-green-300";
    case "lime":
      return "text-lime-900 dark:text-lime-300";
    case "orange":
      return "text-orange-900 dark:text-orange-300";
    case "red":
      return "text-red-900 dark:text-red-400";
  }
}

export default function NavbarButton({
  icon,
  href,
  name,
  isIconOnly,
  description,
  hotkey,
  onPress,
  color = "blue",
  className,
}: NavbarButtonProps) {
  return (
    <NavbarItem>
      <NavbarTooltip
        icon={icon}
        name={name}
        description={description}
        hotkey={hotkey}
      >
        <Button
          className={`${colorToTextHover(color)} ${colorToText(
            color
          )} ${className}`}
          isIconOnly={isIconOnly}
          href={href}
          as={Link}
          startContent={icon}
          size="sm"
          variant="light"
          onPress={onPress}
        >
          {isIconOnly ? "" : name}
          {hotkey && (
            <Hotkey
              href={href}
              hotkey={hotkey}
              onPress={onPress}
              title={name}
              description={description}
            />
          )}
        </Button>
      </NavbarTooltip>
    </NavbarItem>
  );
}
