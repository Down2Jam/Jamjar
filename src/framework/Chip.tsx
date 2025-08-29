// Chip.tsx
"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import * as React from "react";
import Link from "next/link";
import Icon from "./Icon";
import type { IconName } from "./Icon";
import { Avatar } from "./Avatar";
import { Hstack } from "./Stack";

type ChipColor =
  | "default"
  | "blue"
  | "green"
  | "pink"
  | "red"
  | "yellow"
  | "purple"
  | "gray";

type Shared = {
  color?: ChipColor;
  icon?: IconName;
  iconSize?: number;

  avatarSrc?: string;
  avatarAlt?: string;
  avatarFallback?: string;
  avatarSize?: number; // default 16
  avatarRounded?: boolean; // default true
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export type ChipAsSpan = Shared &
  React.HTMLAttributes<HTMLSpanElement> & {
    href?: undefined;
  };

export type ChipAsLink = Shared &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    prefetch?: boolean;
  };

export type ChipProps = ChipAsSpan | ChipAsLink;

export function Chip(props: ChipProps) {
  const {
    color = "default",
    className = "",
    icon,
    iconSize = 14,
    avatarSrc,
    avatarAlt = "Avatar",
    avatarFallback,
    avatarSize = 16,
    avatarRounded = true,
    children,
    style: styleProp,
    ...rest
  } = props as ChipProps;

  const href = "href" in props ? props.href : undefined;
  const prefetch = "prefetch" in props ? props.prefetch : undefined;
  const target = "target" in rest ? rest.target : undefined;
  const relFromProps = "rel" in rest ? rest.rel : undefined;

  const { colors } = useTheme();

  // Base styles
  let style: React.CSSProperties = {
    backgroundColor: colors["mantle"],
    borderColor: colors["base"],
    color: colors["text"],
    ...styleProp,
  };

  // Match Button color variants
  if (color === "blue") {
    style = {
      ...style,
      backgroundColor: colors["blueDarkDark"] + "88",
      borderColor: colors["blue"],
      color: colors["blue"],
    };
  } else if (color === "green") {
    style = {
      ...style,
      backgroundColor: colors["greenDarkDark"] + "88",
      borderColor: colors["green"],
      color: colors["green"],
    };
  } else if (color === "pink") {
    style = {
      ...style,
      backgroundColor: colors["pinkDarkDark"] + "88",
      borderColor: colors["pink"],
      color: colors["pink"],
    };
  } else if (color === "red") {
    style = {
      ...style,
      backgroundColor: colors["redDarkDark"] + "88",
      borderColor: colors["red"],
      color: colors["red"],
    };
  } else if (color === "yellow") {
    style = {
      ...style,
      backgroundColor: colors["yellowDarkDark"] + "88",
      borderColor: colors["yellow"],
      color: colors["yellow"],
    };
  } else if (color === "purple") {
    style = {
      ...style,
      backgroundColor: colors["purpleDarkDark"] + "88",
      borderColor: colors["purple"],
      color: colors["purple"],
    };
  } else if (color === "gray") {
    style = {
      ...style,
      backgroundColor: colors["grayDarkDark"] + "88",
      borderColor: colors["gray"],
      color: colors["gray"],
    };
  }

  const baseClasses = [
    "inline-flex items-center text-xs gap-1 font-medium border px-2 py-0.5 rounded-md transition-all duration-300",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
    href ? "cursor-pointer" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <Hstack>
      {(avatarSrc || avatarFallback) && (
        <Avatar
          src={avatarSrc}
          alt={avatarAlt}
          fallback={avatarFallback}
          size={avatarSize}
          rounded={avatarRounded}
          className="shrink-0"
        />
      )}
      {icon && <Icon name={icon} size={iconSize} />}
      <span className="leading-none">{children}</span>
    </Hstack>
  );

  if (href) {
    const linkRel =
      target === "_blank"
        ? relFromProps ?? "noopener noreferrer"
        : relFromProps;

    return (
      <Link
        href={href}
        prefetch={prefetch}
        className={baseClasses}
        style={style}
        target={target}
        rel={linkRel}
        {...(rest as Omit<ChipAsLink, keyof Shared | "href" | "prefetch">)}
      >
        {content}
      </Link>
    );
  }

  return (
    <span
      className={baseClasses}
      style={style}
      {...(rest as Omit<ChipAsSpan, keyof Shared>)}
    >
      {content}
    </span>
  );
}
