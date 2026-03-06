"use client";

import * as React from "react";
import { useTheme } from "./theme";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  href?: string;
  style?: React.CSSProperties;
  onPress?: () => void;
  backgroundImage?: string;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  glass?: boolean;
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
}

export function Card({
  href,
  onPress,
  children,
  className = "",
  style,
  backgroundImage,
  padding = 1,
  paddingX,
  paddingY,
  glass = false,
  radius = "md",
  shadow = "md",
  ...props
}: CardProps) {
  const { colors } = useTheme();
  const radiusValueMap: Record<NonNullable<CardProps["radius"]>, string> = {
    none: "0",
    sm: "0.25rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    full: "9999px",
  };
  const radiusValue = radiusValueMap[radius];

  const shadowClassMap: Record<NonNullable<CardProps["shadow"]>, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };
  const shadowClass = shadowClassMap[shadow];
  const baseClasses = ["border transition-colors duration-500", shadowClass]
    .filter(Boolean)
    .join(" ");

  const mergedStyle: React.CSSProperties = {
    backgroundColor: colors["mantle"],
    borderColor: colors["base"],
    color: colors["text"],
    padding: `${padding}rem`,
    paddingLeft: `${paddingX ?? padding}rem`,
    paddingRight: `${paddingX ?? padding}rem`,
    paddingTop: `${paddingY ?? padding}rem`,
    paddingBottom: `${paddingY ?? padding}rem`,
    borderRadius: radiusValue,
    ...(glass
      ? {
          backgroundColor: "rgba(8, 12, 20, 0.55)",
          borderColor: "rgba(255, 255, 255, 0.25)",
          boxShadow:
            "0 8px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(18px) saturate(140%)",
          WebkitBackdropFilter: "blur(18px) saturate(140%)",
        }
      : {}),
    ...style,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onPress) {
      e.stopPropagation();
      onPress();
    }
  };

  const cardContent = (
    <div
      className={[baseClasses, className, "relative w-full h-full"].join(" ")}
      style={mergedStyle}
      {...props}
    >
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          style={{ borderRadius: radiusValue }}
        >
          <div
            className="absolute inset-0 bg-center bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              opacity: 0.3,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      )}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );

  return href ? (
    <a href={href} onClick={handleClick} className="block">
      {cardContent}
    </a>
  ) : (
    <div onClick={handleClick}>{cardContent}</div>
  );
}
