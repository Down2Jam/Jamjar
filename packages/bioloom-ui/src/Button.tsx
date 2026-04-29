"use client";

import * as React from "react";
import Link from "@/compat/next-link";
import { useTheme } from "./theme";
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
import { Chip } from "./Chip";
import Tooltip from "./Tooltip";

const isExternalHref = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://");

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
    kbd,
    style,
    leftSlot,
    rightSlot,
    tooltip,
    glass = false,
    ...rest
  } = props;

  const { colors } = useTheme();
  const [hovered, setHovered] = React.useState(false);

  const isIconOnly =
    props.children === undefined &&
    !!(icon || leftSlot) &&
    !rightSlot &&
    !loading;

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
    ghost: {
      color: colors["text"],
      borderColor: "transparent",
      backgroundColor: "transparent",
    },
  };

  if (color === "blue") {
    variantStyles.standard = {
      color: colors["blue"],
      borderColor: colors["blue"],
      backgroundColor: colors["blueDarkDark"] + "88",
    };
    variantStyles.ghost = {
      color: colors["blue"],
      borderColor: "transparent",
      backgroundColor: "transparent",
    };
  } else if (color === "green") {
    variantStyles.standard = {
      color: colors["green"],
      borderColor: colors["green"],
      backgroundColor: colors["greenDarkDark"] + "88",
    };
    variantStyles.ghost = {
      color: colors["green"],
      borderColor: "transparent",
      backgroundColor: "transparent",
    };
  } else if (color === "pink") {
    variantStyles.standard = {
      color: colors["pink"],
      borderColor: colors["pink"],
      backgroundColor: colors["pinkDarkDark"] + "88",
    };
    variantStyles.ghost = {
      color: colors["pink"],
      borderColor: "transparent",
      backgroundColor: "transparent",
    };
  } else if (color === "red") {
    variantStyles.standard = {
      color: colors["red"],
      borderColor: colors["red"],
      backgroundColor: colors["redDarkDark"] + "88",
    };
    variantStyles.ghost = {
      color: colors["red"],
      borderColor: "transparent",
      backgroundColor: "transparent",
    };
  } else if (color === "yellow") {
    variantStyles.standard = {
      color: colors["yellow"],
      borderColor: colors["yellow"],
      backgroundColor: colors["yellowDarkDark"] + "88",
    };
    variantStyles.ghost = {
      color: colors["yellow"],
      borderColor: "transparent",
      backgroundColor: "transparent",
    };
  } else if (color === "purple") {
    variantStyles.standard = {
      color: colors["purple"],
      borderColor: colors["purple"],
      backgroundColor: colors["purpleDarkDark"] + "88",
    };
    variantStyles.ghost = {
      color: colors["purple"],
      borderColor: "transparent",
      backgroundColor: "transparent",
    };
  } else if (color === "gray") {
    variantStyles.standard = {
      color: colors["gray"],
      borderColor: colors["gray"],
      backgroundColor: colors["grayDarkDark"] + "88",
    };
    variantStyles.ghost = {
      color: colors["gray"],
      borderColor: "transparent",
      backgroundColor: "transparent",
    };
  }

  if (disabled && color === "default") {
    variantStyles.standard = {
      borderColor: colors["mantle"],
      color: colors["textFaded"],
      backgroundColor: colors["crust"],
    };
    variantStyles.ghost = {
      borderColor: "transparent",
      color: colors["textFaded"],
      backgroundColor: "transparent",
    };
  }

  const glassStyle: React.CSSProperties = {
    backgroundColor: "rgba(8, 12, 20, 0.45)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px) saturate(120%)",
    WebkitBackdropFilter: "blur(10px) saturate(120%)",
  };

  const glassHoverStyle: React.CSSProperties = {
    backgroundColor: "rgba(8, 12, 20, 0.6)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  };

  const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
    standard: { backgroundColor: colors["base"] },
    ghost: { backgroundColor: colors["base"] },
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
  } else if (color === "purple") {
    hoverStyles.standard = {
      backgroundColor: colors["purpleDark"],
      color: colors["purpleLight"],
    };
  } else if (color === "gray") {
    hoverStyles.standard = {
      backgroundColor: colors["grayDark"],
      color: colors["grayLight"],
    };
  }

  const commonClass = [
    "inline-flex items-center justify-center font-medium border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    variant === "ghost" ? "shadow-none" : "shadow-md",
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    disabled || loading ? "opacity-20 cursor-not-allowed" : "cursor-pointer",
    className,
  ].join(" ");

  const commonStyle: React.CSSProperties = {
    ...variantStyles[variant],
    ...(glass ? glassStyle : {}),
    ...(hovered ? (glass ? glassHoverStyle : hoverStyles[variant]) : {}),
    ...style,
  };

  const resolvedLeft = !loading
    ? leftSlot ?? (icon && <Icon size={16} name={icon} />)
    : null;

  const hasLabel = props.children !== undefined && props.children !== null;
  const content = (
    <>
      {loading && <Loader2 className="animate-spin" size={16} />}
      {resolvedLeft}
      {hasLabel && <Text size="xs">{props.children}</Text>}
      {kbd && <Chip color={color}>{kbd}</Chip>}
      {rightSlot}
    </>
  );

  // Link mode
  let element: React.ReactNode;
  if ("href" in props && props.href) {
    const {
      href,
      externalIcon = true,
      target,
      rel,
      ...linkProps
    } = rest as ButtonAsLink;

    const isExternal = !isIconOnly && isExternalHref(href);
    const resolvedRel =
      rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);

    if (isExternal) {
      element = (
        <a
          href={href}
          className={commonClass}
          style={commonStyle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          target={target}
          rel={resolvedRel}
          {...linkProps}
        >
          {content}
          {externalIcon && <ExternalLink size={16} className="ml-2 shrink-0" />}
        </a>
      );
    } else {
      element = (
        <Link
          href={href}
          className={commonClass}
          style={commonStyle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          target={target}
          rel={resolvedRel}
          {...linkProps}
        >
          {content}
        </Link>
      );
    }
  } else {
    // Button mode
    const { type = "button", ...buttonProps } = rest as ButtonAsButton;
    element = (
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

  return tooltip ? (
    <Tooltip position="top" content={tooltip}>
      {element}
    </Tooltip>
  ) : (
    element
  );
}
