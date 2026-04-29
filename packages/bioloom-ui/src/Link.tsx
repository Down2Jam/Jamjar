"use client";

import NextLink from "@/compat/next-link";
import { ExternalLink } from "lucide-react";
import { useTheme } from "./theme";
import { ReactNode, useState, type CSSProperties } from "react";

const isExternalHref = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://");

interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  useThemeColors?: boolean;
  showExternalIcon?: boolean;
  target?: "_blank" | "_self";
  rel?: string;
  underline?: boolean;
}

export function Link({
  href,
  children,
  className = "",
  style,
  useThemeColors = true,
  showExternalIcon = true,
  target,
  rel,
  underline = true,
}: LinkProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);

  const isExternal = isExternalHref(href);

  const resolvedTarget = target ?? (isExternal ? "_blank" : "_self");
  const resolvedRel =
    rel ??
    (resolvedTarget === "_blank" && isExternal
      ? "noopener noreferrer"
      : undefined);

  const classes = `inline-flex items-center gap-1 underline transition-colors duration-300 ${
    underline ? "underline" : "no-underline"
  } ${className}`;
  const mergedStyle = {
    ...(useThemeColors
      ? { color: hovered ? colors.blueDark : colors.blue }
      : {}),
    ...style,
  };

  if (isExternal) {
    return (
      <a
        href={href}
        target={resolvedTarget}
        rel={resolvedRel}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={classes}
        style={mergedStyle}
      >
        {children}
        {showExternalIcon && <ExternalLink size={14} className="shrink-0" />}
      </a>
    );
  }

  return (
    <NextLink
      href={href}
      target={target}
      rel={rel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={classes}
      style={mergedStyle}
    >
      {children}
    </NextLink>
  );
}
