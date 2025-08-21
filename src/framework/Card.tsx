"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "@/providers/SiteThemeProvider";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  href?: string;
  style?: React.CSSProperties;
  onPress?: () => void;
  backgroundImage?: string;
  padding?: number;
}

export function Card({
  href,
  onPress,
  children,
  className = "",
  style,
  backgroundImage,
  padding = 1,
  ...props
}: CardProps) {
  const { colors } = useTheme();

  const baseClasses =
    "rounded-xl border shadow-md transition-colors duration-500";

  const mergedStyle: React.CSSProperties = {
    backgroundColor: colors["mantle"],
    borderColor: colors["base"],
    color: colors["text"],
    padding: `${padding}rem`,
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
        <div className="absolute inset-0 z-0 rounded-xl overflow-hidden pointer-events-none">
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
    <Link href={href} onClick={handleClick} className="block">
      {cardContent}
    </Link>
  ) : (
    <div onClick={handleClick}>{cardContent}</div>
  );
}
