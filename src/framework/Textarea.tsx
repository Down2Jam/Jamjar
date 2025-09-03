"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { InputSize, InputVariant } from "./Input.types";
import { TextareaProps } from "./Textarea.type";
import { useTranslations } from "next-intl";

export function Textarea({
  className = "",
  variant = "standard",
  size = "md",
  disabled = false,
  fullWidth = false,
  label,
  labelPlacement = "outside",
  onValueChange,
  placeholder,
  ...props
}: TextareaProps) {
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
    xs: "text-[8px] rounded-sm px-2 py-1",
    sm: "text-[10px] rounded-md px-3 py-1.5",
    md: "text-xs rounded-lg px-4 py-2",
    lg: "text-sm rounded-xl px-5 py-3",
  };

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

  const textareaElement = (
    <label
      className={[
        "inline-flex flex-col border transition-colors duration-300",
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
      <textarea
        className="w-full bg-transparent outline-none resize-none"
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={resolvedPlaceholder}
        {...props}
      />
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
      {textareaElement}
      {label && labelPlacement === "inside" && (
        <span className="absolute left-3 text-xs text-gray-400 pointer-events-none">
          {label}
        </span>
      )}
    </div>
  );
}
