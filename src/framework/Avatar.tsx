"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";
import Image from "next/image";

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

  return (
    <div
      className={[
        "overflow-hidden inline-flex items-center justify-center font-medium",
        rounded ? "rounded-full" : "rounded-md",
        className,
      ].join(" ")}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.base}`,
        color: colors.text,
      }}
      {...props}
    >
      {showImage ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Image
            src={src}
            alt={alt}
            fill
            style={{ objectFit: "cover" }}
            onError={() => setIsError(true)}
          />
        </div>
      ) : (
        fallback?.slice(0, 2).toUpperCase() ?? "?"
      )}
    </div>
  );
}
