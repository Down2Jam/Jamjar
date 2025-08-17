"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  className = "",
  size = "md",
}: SwitchProps) {
  const { colors } = useTheme();

  const sizes = {
    sm: { width: 32, height: 16, circle: 12 },
    md: { width: 40, height: 20, circle: 16 },
    lg: { width: 48, height: 24, circle: 20 },
  };

  const current = sizes[size];

  return (
    <button
      role="switch"
      type="button"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      style={{
        width: current.width,
        height: current.height,
        backgroundColor: checked ? colors.greenDark : colors.base,
        boxShadow: `inset 0 1px 2px ${colors.crust}`,
      }}
    >
      <span
        className="inline-block transform rounded-full transition-all duration-300 shadow-md"
        style={{
          width: current.circle,
          height: current.circle,
          transform: `translateX(${
            checked ? current.width - current.circle - 4 : 4
          }px)`,
          backgroundColor: checked ? colors.text : colors.textFaded,
        }}
      />
    </button>
  );
}
