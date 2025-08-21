"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "@/providers/SiteThemeProvider";
import { ExternalLink, Loader2 } from "lucide-react";
import Icon from "./Icon";
import type {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  ButtonAsLink,
  ButtonAsButton,
} from "./Button.types";
import Text from "./Text";

export function Button(props: ButtonProps) {
  const {
    variant = "standard",
    size = "md",
    loading = false,
    disabled,
    fullWidth = false,
    icon,
    color = "default",
    className = "",
    style,
  } = props;

  const { colors } = useTheme();
  const [hovered, setHovered] = React.useState(false);

  const isIconOnly = props.children === undefined && !!icon && !loading;

  const sizeClasses: Record<ButtonSize, string> = {
    xs: isIconOnly
      ? "h-4 w-4 rounded-sm"
      : "h-4 p-4 px-2 text-[8px] rounded-sm gap-1",
    sm: isIconOnly
      ? "h-6 w-6 rounded-md"
      : "h-6 p-4 px-3 text-[10px] rounded-md gap-2",
    md: isIconOnly
      ? "h-8 w-8 rounded-lg"
      : "h-8 p-4 px-4 text-xs rounded-lg gap-2",
    lg: isIconOnly
      ? "h-10 w-10 rounded-xl"
      : "h-10 p-4 px-5 text-sm rounded-xl gap-3",
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    standard: {
      color: colors["text"],
      borderColor: colors["base"],
      backgroundColor: colors["mantle"],
    },
  };

  if (color === "blue") {
    variantStyles.standard = {
      color: colors["blue"],
      borderColor: colors["blue"],
      backgroundColor: colors["blueDarkDark"] + "88",
    };
  } else if (color === "green") {
    variantStyles.standard = {
      color: colors["green"],
      borderColor: colors["green"],
      backgroundColor: colors["greenDarkDark"] + "88",
    };
  } else if (color === "pink") {
    variantStyles.standard = {
      color: colors["pink"],
      borderColor: colors["pink"],
      backgroundColor: colors["pinkDarkDark"] + "88",
    };
  } else if (color === "red") {
    variantStyles.standard = {
      color: colors["red"],
      borderColor: colors["red"],
      backgroundColor: colors["redDarkDark"] + "88",
    };
  } else if (color === "yellow") {
    variantStyles.standard = {
      color: colors["yellow"],
      borderColor: colors["yellow"],
      backgroundColor: colors["yellowDarkDark"] + "88",
    };
  }

  if (disabled && color === "default") {
    variantStyles.standard = {
      borderColor: colors["mantle"],
      color: colors["textFaded"],
      backgroundColor: colors["crust"],
    };
  }

  const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
    standard: { backgroundColor: colors["base"] },
  };

  if (color === "blue") {
    hoverStyles.standard = {
      backgroundColor: colors["blueDark"],
      color: colors["blueLight"],
    };
  } else if (color === "green") {
    hoverStyles.standard = {
      backgroundColor: colors["greenDark"],
      color: colors["greenLight"],
    };
  } else if (color === "pink") {
    hoverStyles.standard = {
      backgroundColor: colors["pinkDark"],
      color: colors["pinkLight"],
    };
  } else if (color === "red") {
    hoverStyles.standard = {
      backgroundColor: colors["redDark"],
      color: colors["redLight"],
    };
  } else if (color === "yellow") {
    hoverStyles.standard = {
      backgroundColor: colors["yellowDark"],
      color: colors["yellowLight"],
    };
  }

  const commonClass = [
    "inline-flex items-center justify-center font-medium border transition-colors duration-300 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    disabled || loading ? "opacity-20 cursor-not-allowed" : "",
    className,
  ].join(" ");

  const commonStyle: React.CSSProperties = {
    ...variantStyles[variant],
    ...(hovered ? hoverStyles[variant] : {}),
    ...style,
  };

  const content = (
    <>
      {loading && <Loader2 className="animate-spin" size={16} />}
      {!loading && icon && <Icon size={16} name={icon} />}
      <Text size="xs">{props.children}</Text>
    </>
  );

  // Link mode
  if ("href" in props && props.href) {
    const { href, externalIcon = true, ...linkProps } = props as ButtonAsLink;

    const isExternal =
      !isIconOnly &&
      typeof window !== "undefined" &&
      (() => {
        try {
          const url = new URL(href, window.location.origin);
          return url.origin !== window.location.origin;
        } catch {
          return false;
        }
      })();

    return (
      <Link
        href={href}
        className={commonClass}
        style={commonStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        {...linkProps}
      >
        {content}
        {isExternal && externalIcon && (
          <ExternalLink size={16} className="ml-2 shrink-0" />
        )}
      </Link>
    );
  }

  // Button mode
  const { type = "button", ...buttonProps } = props as ButtonAsButton;
  return (
    <button
      className={commonClass}
      style={commonStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled || loading}
      type={type}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
