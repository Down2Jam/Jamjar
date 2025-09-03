"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { InputProps, InputSize, InputVariant } from "./Input.types";
import { useTranslations } from "next-intl";

export function Input({
  className = "",
  variant = "standard",
  size = "md",
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  label,
  labelPlacement = "outside",
  onValueChange,
  placeholder,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const t = useTranslations();

  const maybeKey = placeholder?.trim();
  const looksLikeKey = !!maybeKey && /^\w+(?:\.\w+)+$/.test(maybeKey);
  let resolvedPlaceholder = placeholder;
  if (looksLikeKey) {
    try {
      resolvedPlaceholder = t(maybeKey!);
    } catch {
      /* keep raw string if no translation */
    }
  }

  const sizeClasses: Record<InputSize, string> = {
    xs: "h-4 text-[8px] rounded-sm px-2 gap-1",
    sm: "h-6 text-[10px] rounded-md px-3 gap-2",
    md: "h-8 text-xs rounded-lg px-4 gap-2",
    lg: "h-10 text-sm rounded-xl px-5 gap-3",
  };

  // Variant styles from theme
  const variantStyles: Record<InputVariant, React.CSSProperties> = {
    standard: {
      color: colors["text"],
      borderColor: colors["base"],
      backgroundColor: colors["mantle"],
      boxShadow: `inset 0 1px 2px ${colors.crust}`,
    },
  };

  if (disabled) {
    variantStyles.standard = {
      borderColor: colors["mantle"],
      color: colors["textFaded"],
      backgroundColor: colors["crust"],
      boxShadow: `inset 0 1px 2px ${colors.crust}`,
    };
  }

  const focusStyles: React.CSSProperties = {
    borderColor: colors.blue,
  };

  const [focused, setFocused] = React.useState(false);

  const inputElement = (
    <label
      className={[
        "inline-flex items-center border transition-colors duration-300",
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      ].join(" ")}
      style={{
        ...variantStyles[variant],
        ...(focused ? focusStyles : {}),
      }}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <input
        className="flex-1 bg-transparent outline-none"
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={resolvedPlaceholder}
        {...props}
      />
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </label>
  );

  return (
    <div
      className={fullWidth ? "w-full flex flex-col" : "inline-flex flex-col"}
    >
      {label && labelPlacement === "outside" && (
        <span
          className={`mb-1 text-sm font-medium ${disabled ? "opacity-50" : ""}`}
          style={{ color: colors.text }}
        >
          {label}
        </span>
      )}
      {inputElement}
      {label && labelPlacement === "inside" && (
        <span className="absolute left-3 text-xs text-gray-400 pointer-events-none">
          {label}
        </span>
      )}
    </div>
  );
}
