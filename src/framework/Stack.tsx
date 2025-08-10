"use client";

import * as React from "react";
import { HstackProps, StackProps, VstackProps } from "./Stack.types";

const alignClass = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

const justifyClass = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
} as const;

export function Stack({
  children,
  className = "",
  direction = "row",
  gap = 2,
  align = "center",
  justify = "start",
  wrap = false,
  ...props
}: StackProps) {
  const gapClass = typeof gap === "number" ? `gap-${gap}` : "";
  const gapStyle = typeof gap === "string" && !gapClass ? { gap } : undefined;

  return (
    <div
      className={[
        "flex",
        direction === "col" ? "flex-col" : "flex-row",
        alignClass[align],
        justifyClass[justify],
        wrap ? "flex-wrap" : "flex-nowrap",
        typeof gap === "number" ? gapClass : "",
        className,
      ].join(" ")}
      style={gapStyle}
      {...props}
    >
      {children}
    </div>
  );
}

export function Hstack(props: HstackProps) {
  return <Stack direction="row" {...props} />;
}

export function Vstack(props: VstackProps) {
  return <Stack direction="col" {...props} />;
}
