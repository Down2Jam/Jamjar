"use client";

import * as React from "react";
import { useTheme } from "./theme";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: number;
  fallback?: string;
  rounded?: boolean;
}

export function Avatar({
  src,
  alt = "Avatar",
  size = 32,
  fallback,
  rounded = true,
  className = "",
  style: styleProp,
  ...props
}: AvatarProps) {
  const { colors } = useTheme();
  const [isError, setIsError] = React.useState(false);

  // check if src is a valid URL
  const isValidUrl = React.useMemo(() => {
    if (!src) return false;
    try {
      new URL(src);
      return true;
    } catch {
      return false;
    }
  }, [src]);

  const showImage = src && isValidUrl && !isError;
  const resolvedStyle: React.CSSProperties = {
    ...(styleProp ?? {}),
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    flexShrink: 0,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.base}`,
    color: colors.text,
  };

  return (
    <div
      className={[
        "overflow-hidden inline-flex items-center justify-center font-medium",
        rounded ? "rounded-full" : "rounded-md",
        className,
      ].join(" ")}
      style={resolvedStyle}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setIsError(true)}
        />
      ) : (
        fallback?.slice(0, 2).toUpperCase() ?? "?"
      )}
    </div>
  );
}
