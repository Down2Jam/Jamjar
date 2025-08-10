"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Loader2 } from "lucide-react";
import { ButtonProps, ButtonSize, ButtonVariant } from "./Button.types";

export function Button({
  children,
  className = "",
  variant = "standard",
  size = "md",
  loading = false,
  disabled,
  fullWidth = false,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "h-6 px-3 text-xs rounded-md gap-2",
    md: "h-8 px-4 text-xs rounded-lg gap-2",
    lg: "h-10 px-5 text-sm rounded-xl gap-3",
  };

  const [hovered, setHovered] = React.useState(false);

  // Variant styles from theme
  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    standard: {
      color: colors["text"],
      borderColor: colors["base"],
      backgroundColor: colors["mantle"],
    },
  };

  const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
    standard: { backgroundColor: colors["base"] },
  };

  return (
    <button
      className={[
        "inline-flex items-center justify-center font-medium border transition-colors duration-200 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        disabled || loading ? "opacity-60 cursor-not-allowed" : "",
        className,
      ].join(" ")}
      style={{
        ...variantStyles[variant],
        ...(hovered ? hoverStyles[variant] : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={16} />}
      {!loading && leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}
