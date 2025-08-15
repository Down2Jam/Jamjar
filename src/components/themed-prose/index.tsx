"use client";
import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";

export default function ThemedProse({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  const { colors } = useTheme();

  // Map your theme tokens -> prose variables
  const proseVars = {
    // text
    ["--tw-prose-body"]: colors["textFaded"],
    ["--tw-prose-headings"]: colors["text"],
    ["--tw-prose-lead"]: colors["text"],
    ["--tw-prose-links"]: colors["blue"],
    ["--tw-prose-bold"]: colors["text"],
    ["--tw-prose-counters"]: colors["text"],
    ["--tw-prose-bullets"]: colors["textFaded"],
    ["--tw-prose-hr"]: colors["text"],
    ["--tw-prose-quotes"]: colors["text"],
    ["--tw-prose-quote-borders"]: colors["text"],
    ["--tw-prose-captions"]: colors["text"],
    ["--tw-prose-code"]: colors["text"],
    ["--tw-prose-pre-code"]: colors["text"],
    ["--tw-prose-pre-bg"]: colors["mantle"],
    ["--tw-prose-th-borders"]: colors["text"],
    ["--tw-prose-td-borders"]: colors["text"],
  } as React.CSSProperties;

  return (
    <article className={`prose max-w-none ${className}`} style={proseVars}>
      {children}
    </article>
  );
}
