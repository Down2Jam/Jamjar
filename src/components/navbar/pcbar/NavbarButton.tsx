import { Link } from "@heroui/link";
import { NavbarItem } from "@heroui/navbar";
import { Button } from "@heroui/button";
import { ReactNode } from "react";
import Hotkey from "../../hotkey";
import NavbarTooltip from "./NavbarTooltip";
import { useTheme } from "@/providers/SiteThemeProvider";

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
  const { siteTheme } = useTheme();

  return (
    <NavbarItem>
      <NavbarTooltip
        icon={icon}
        name={name}
        description={description}
        hotkey={hotkey}
      >
        <Button
          className={` ${className}`}
          style={{
            color: siteTheme.colors[color],
          }}
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
