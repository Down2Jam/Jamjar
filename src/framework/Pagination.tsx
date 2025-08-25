"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Button } from "@/framework/Button";

type PaginationVariant = "solid" | "faded";
type PaginationSize = "sm" | "md" | "lg";

export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  page: number;
  total: number;
  onChange: (nextPage: number) => void;
  showControls?: boolean;
  variant?: PaginationVariant;
  size?: PaginationSize;
  siblings?: number;
  boundaries?: number;
  showFirstLast?: boolean;
}

function makeRange(
  page: number,
  total: number,
  siblings: number,
  boundaries: number
): Array<number | "..."> {
  const range: Array<number | "..."> = [1];

  const start = Math.max(2, page - siblings);
  const end = Math.min(total - 1, page + siblings);

  // left boundary
  if (start > 2 + boundaries) {
    for (let i = 2; i < 2 + boundaries; i++) range.push(i);
    range.push("...");
  } else {
    for (let i = 2; i < start; i++) range.push(i);
  }

  // middle window
  for (let i = start; i <= end; i++) range.push(i);

  // right boundary
  if (end < total - 1 - boundaries) {
    range.push("...");
    for (let i = total - boundaries; i < total; i++) range.push(i);
  } else {
    for (let i = end + 1; i < total; i++) range.push(i);
  }

  if (total > 1) range.push(total);

  // ensure uniqueness with explicit generic (prevents TS widening)
  return Array.from(new Set<number | "...">(range));
}

export function Pagination({
  page,
  total,
  onChange,
  showControls = true,
  showFirstLast = true,
  variant = "faded",
  size = "md",
  siblings = 1,
  boundaries = 0,
  className = "",
  ...rest
}: PaginationProps) {
  const { colors } = useTheme();
  const canPrev = page > 1;
  const canNext = page < total;

  const items: Array<number | "..."> =
    total <= 7
      ? Array.from({ length: Math.max(total, 1) }, (_, i) => i + 1)
      : makeRange(page, total, siblings, boundaries);

  const btnStyle: React.CSSProperties =
    variant === "faded"
      ? {
          background: "transparent",
          borderColor: colors.base,
          color: colors.text,
        }
      : {
          background: colors.base,
          borderColor: colors.base,
          color: colors.text,
        };

  return (
    <nav
      className={["flex items-center gap-2", className].join(" ")}
      aria-label="Pagination"
      {...rest}
    >
      {showControls && showFirstLast && (
        <Button
          size={size}
          disabled={!canPrev}
          onClick={() => canPrev && onChange(1)}
          style={btnStyle}
        >
          «
        </Button>
      )}
      {showControls && (
        <Button
          size={size}
          disabled={!canPrev}
          onClick={() => canPrev && onChange(page - 1)}
          style={btnStyle}
        >
          ‹
        </Button>
      )}

      {items.map((it, i) =>
        it === "..." ? (
          <span
            key={`dots-${i}`}
            className="px-2 text-xs select-none"
            style={{ color: colors.textFaded }}
          >
            …
          </span>
        ) : (
          <Button
            key={it}
            size={size}
            onClick={() => onChange(it)}
            disabled={page === it}
            style={
              page === it
                ? {
                    background: colors.blue,
                    borderColor: colors.blue,
                    color: colors.mantle,
                  }
                : btnStyle
            }
          >
            {it}
          </Button>
        )
      )}

      {showControls && (
        <Button
          size={size}
          disabled={!canNext}
          onClick={() => canNext && onChange(page + 1)}
          style={btnStyle}
        >
          ›
        </Button>
      )}
      {showControls && showFirstLast && (
        <Button
          size={size}
          disabled={!canNext}
          onClick={() => canNext && onChange(total)}
          style={btnStyle}
        >
          »
        </Button>
      )}
    </nav>
  );
}
