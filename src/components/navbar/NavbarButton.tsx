import { Link } from "@heroui/link";
import { NavbarItem } from "@heroui/navbar";
import { Button } from "@heroui/button";
import { ReactNode } from "react";
import { Tooltip } from "@heroui/tooltip";
import { Kbd } from "@heroui/kbd";
import ClientNavbarButton from "./ClientNavbarButton";

interface NavbarButtonProps {
  icon?: ReactNode;
  href: string;
  name?: string;
  isIconOnly?: boolean;
  description?: string;
  hotkey?: string[];
  color?: "blue" | "yellow" | "green" | "lime" | "orange" | "red";
}

function colorToTextHover(
  color: "blue" | "yellow" | "green" | "lime" | "orange" | "red"
) {
  switch (color) {
    case "blue":
      return "hover:text-blue-200";
    case "yellow":
      return "hover:text-yellow-200";
    case "green":
      return "hover:text-green-200";
    case "lime":
      return "hover:text-lime-200";
    case "orange":
      return "hover:text-orange-200";
    case "red":
      return "hover:text-red-200";
  }
}

function colorToText(
  color: "blue" | "yellow" | "green" | "lime" | "orange" | "red"
) {
  switch (color) {
    case "blue":
      return "text-blue-800 dark:text-blue-300";
    case "yellow":
      return "text-yellow-800 dark:text-yellow-300";
    case "green":
      return "text-green-800 dark:text-green-300";
    case "lime":
      return "text-lime-800 dark:text-lime-300";
    case "orange":
      return "text-orange-800 dark:text-orange-300";
    case "red":
      return "text-red-800 dark:text-red-400";
  }
}

export default function NavbarButton({
  icon,
  href,
  name,
  isIconOnly,
  description,
  hotkey,
  color = "blue",
}: NavbarButtonProps) {
  return (
    <NavbarItem>
      <Tooltip
        delay={1000}
        className="bg-black border-2 border-gray-900"
        content={
          <div className="flex items-center flex-col">
            <div className="flex items-center gap-2">
              {icon}
              <p>{name}</p>
              <Kbd className="bg-gray-900">{hotkey?.join(" ")}</Kbd>
            </div>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        }
      >
        <Button
          className={`${colorToTextHover(color)} ${colorToText(color)}`}
          isIconOnly={isIconOnly}
          href={href}
          as={Link}
          startContent={icon}
          size="sm"
          variant="light"
        >
          {isIconOnly ? "" : name}
          {hotkey && <ClientNavbarButton href={href} hotkey={hotkey} />}
        </Button>
      </Tooltip>
    </NavbarItem>
  );
}
