"use client";
import * as React from "react";
import { useTheme } from "@/providers/useSiteTheme";

export default function ThemedProse({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  const { colors } = useTheme();

  // Map your theme tokens -> prose variables
  const proseVars = {
    // text
    ["--tw-prose-body"]: colors["text"],
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
    <article
      className={`prose max-w-none
        [&_h1]:my-4
        [&_h1]:text-4xl
        [&_h1]:font-semibold
        [&_h1]:leading-tight
        [&_h2]:my-4
        [&_h2]:text-3xl
        [&_h2]:font-semibold
        [&_h2]:leading-tight
        [&_h3]:my-3
        [&_h3]:text-2xl
        [&_h3]:font-semibold
        [&_h3]:leading-snug
        [&_p]:my-3
        [&_p:empty]:block
        [&_p:empty]:h-[1.25em]
        [&_p:empty]:my-3
        [&_p>br:only-child]:block
        [&_a]:underline
        [&_a]:underline-offset-2
        [&_a:hover]:opacity-80
        [&_blockquote]:my-4
        [&_blockquote]:border-l-4
        [&_blockquote]:pl-4
        [&_blockquote]:italic
        [&_ul]:my-4
        [&_ul]:list-disc
        [&_ul]:pl-6
        [&_ol]:my-4
        [&_ol]:list-decimal
        [&_ol]:pl-6
        [&_li]:my-1
        [&_pre]:my-4
        [&_pre]:overflow-x-auto
        [&_pre]:rounded-xl
        [&_pre]:border
        [&_pre]:p-4
        [&_code]:rounded
        [&_code]:px-1.5
        [&_code]:py-0.5
        [&_pre_code]:bg-transparent
        [&_pre_code]:p-0
        ${className}`}
      style={proseVars}
    >
      {children}
    </article>
  );
}
