"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import { Button, Link, Tooltip } from "@heroui/react";
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
      <Tooltip content={tooltip}>
        <Button
          endContent={icon}
          style={{
            backgroundColor: siteTheme.colors["crust"],
            color: siteTheme.colors["text"],
            borderColor: siteTheme.colors["crust"],
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
      </Tooltip>
    );
  } else {
    return (
      <Button
        endContent={iconPosition == "end" ? icon : undefined}
        startContent={iconPosition == "start" ? icon : undefined}
        style={{
          backgroundColor: siteTheme.colors["base"],
          color: siteTheme.colors["text"],
          borderColor: siteTheme.colors["crust"],
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
