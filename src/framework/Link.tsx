"use client";

import NextLink from "next/link";
import { ExternalLink } from "lucide-react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { ReactNode, useState } from "react";

interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  showExternalIcon?: boolean;
  target?: "_blank" | "_self";
  rel?: string;
}

export function Link({
  href,
  children,
  className = "",
  showExternalIcon = true,
  target,
  rel,
}: LinkProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);

  const isExternal =
    typeof window !== "undefined" &&
    (() => {
      try {
        const url = new URL(href, window.location.origin);
        return url.origin !== window.location.origin;
      } catch {
        return false;
      }
    })();

  const resolvedTarget = target ?? (isExternal ? "_blank" : "_self");
  const resolvedRel =
    rel ??
    (resolvedTarget === "_blank" && isExternal
      ? "noopener noreferrer"
      : undefined);

  return (
    <NextLink
      href={href}
      target={resolvedTarget}
      rel={resolvedRel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-center gap-1 underline transition-colors duration-300 ${className}`}
      style={{ color: hovered ? colors.blueDark : colors.blue }}
    >
      {children}
      {isExternal && showExternalIcon && (
        <ExternalLink size={14} className="shrink-0" />
      )}
    </NextLink>
  );
}
