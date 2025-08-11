"use client";

import React, { forwardRef } from "react";
import { useTheme } from "@/providers/SiteThemeProvider";

type TextColor = "text" | "textFaded" | "blue";

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: number;
  color?: TextColor;
}

const Text = forwardRef<HTMLParagraphElement, TextProps>(function Text(
  { size = 16, color = "text", style, ...rest },
  ref
) {
  const { colors } = useTheme();

  return (
    <p
      ref={ref}
      style={{
        fontSize: size,
        color: colors[color],
        ...(style || {}),
      }}
      {...rest}
    />
  );
});

export default Text;
