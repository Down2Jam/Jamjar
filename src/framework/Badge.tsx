"use client";

import * as React from "react";

export function Badge({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={[
        "inline-flex items-center text-xs font-medium border px-2 py-0.5 transition-colors duration-300 rounded-md",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
