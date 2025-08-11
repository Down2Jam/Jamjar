"use client";

import Tooltip from "@/framework/Tooltip";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Button, Link } from "@heroui/react";
import { ReactNode } from "react";

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
  isIconOnly = false,
  size = "md",
  iconPosition = "end",
}: ButtonLinkProps) {
  const { siteTheme } = useTheme();

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position="top">
        <Button
          endContent={icon}
          style={{
            backgroundColor: siteTheme.colors["mantle"],
            color: siteTheme.colors["text"],
            borderColor: siteTheme.colors["base"],
          }}
          className={`transition-all transform duration-500 ease-in-out border-1 shadow-md`}
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
        style={{
          backgroundColor: siteTheme.colors["mantle"],
          color: siteTheme.colors["text"],
          borderColor: siteTheme.colors["base"],
        }}
        className={`transition-all transform duration-500 ease-in-out`}
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
