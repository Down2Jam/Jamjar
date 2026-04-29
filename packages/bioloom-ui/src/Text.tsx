"use client";

import { forwardRef } from "react";
import { useTranslations } from "@/compat/next-intl";
import { useTheme } from "./theme";
import { TextProps, TextSize, TextWeight } from "./Text.types";

const fontSizes: Record<TextSize, { fontSize: string; lineHeight: string }> = {
  xs: { fontSize: "0.75rem", lineHeight: "1rem" },
  sm: { fontSize: "0.875rem", lineHeight: "1.25rem" },
  md: { fontSize: "1rem", lineHeight: "1.5rem" },
  lg: { fontSize: "1.125rem", lineHeight: "1.75rem" },
  xl: { fontSize: "1.25rem", lineHeight: "1.75rem" },
  "2xl": { fontSize: "1.5rem", lineHeight: "2rem" },
  "3xl": { fontSize: "1.875rem", lineHeight: "2.25rem" },
  "4xl": { fontSize: "2.25rem", lineHeight: "2.5rem" },
  "5xl": { fontSize: "3rem", lineHeight: "1" },
  "6xl": { fontSize: "3.75rem", lineHeight: "1" },
  "7xl": { fontSize: "4.5rem", lineHeight: "1" },
  "8xl": { fontSize: "6rem", lineHeight: "1" },
  "9xl": { fontSize: "8rem", lineHeight: "1" },
};

export const weightMap: Record<TextWeight, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

const Text = forwardRef<HTMLParagraphElement, TextProps>(function Text(
  {
    size = "md",
    color,
    gradient,
    strokeColor,
    strokeWidth,
    weight,
    align,
    transform,
    style,
    className = "",
    children,
    ...rest
  },
  ref
) {
  const { colors } = useTheme();
  const { fontSize, lineHeight } = fontSizes[size] || fontSizes.md;
  const t = useTranslations();
  const resolvedColor =
    (colors as Record<string, string>)[color as string] ?? (color as string);

  const gradientStyles = gradient
    ? {
        backgroundImage: `linear-gradient(${
          gradient.direction ?? "to right"
        }, ${colors[gradient.from]}, ${colors[gradient.to]})`,
        WebkitBackgroundClip: "text" as const,
        backgroundClip: "text",
        WebkitTextFillColor: "transparent" as const,
        color: "transparent",
      }
    : { color: resolvedColor };

  const maybeKey = typeof children === "string" ? children.trim() : undefined;
  const looksLikeKey = !!maybeKey && /^\w+(?:\.\w+)+$/.test(maybeKey);
  let content: React.ReactNode = children;
  if (looksLikeKey) {
    try {
      content = t(maybeKey!);
    } catch {
      /* keep children */
    }
  }

  const strokeShadow =
    strokeWidth !== undefined
      ? (() => {
          const widthPx =
            typeof strokeWidth === "number"
              ? strokeWidth
              : parseFloat(strokeWidth);
          const w = Number.isFinite(widthPx) ? widthPx : 1;
          const c = strokeColor ?? resolvedColor ?? colors["text"];
          return [
            `${w}px 0 0 ${c}`,
            `-${w}px 0 0 ${c}`,
            `0 ${w}px 0 ${c}`,
            `0 -${w}px 0 ${c}`,
            `${w}px ${w}px 0 ${c}`,
            `${w}px -${w}px 0 ${c}`,
            `-${w}px ${w}px 0 ${c}`,
            `-${w}px -${w}px 0 ${c}`,
          ].join(", ");
        })()
      : undefined;

  const useLayeredStroke = Boolean(strokeShadow && gradient);
  const strokeStyle = !useLayeredStroke && strokeShadow
    ? { textShadow: strokeShadow }
    : undefined;

  return (
    <p
      ref={ref}
      style={{
        whiteSpace: "pre-line",
        fontSize,
        lineHeight,
        textAlign: align,
        textTransform: transform,
        fontWeight: weight ? weightMap[weight] : undefined,
        ...(strokeStyle || {}),
        ...(style || {}),
        position: useLayeredStroke ? "relative" : undefined,
        display: useLayeredStroke ? "inline-block" : undefined,
      }}
      className={["w-fit transition-all duration-300", className].join(" ")}
      {...rest}
    >
      {useLayeredStroke && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            textShadow: strokeShadow,
            color: "transparent",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
            display: "inline-block",
          }}
        >
          {content}
        </span>
      )}
      <span
        style={{
          ...gradientStyles,
          position: "relative",
          zIndex: useLayeredStroke ? 1 : undefined,
        }}
      >
        {content}
      </span>
    </p>
  );
});

export default Text;
