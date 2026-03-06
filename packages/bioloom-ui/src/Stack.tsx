"use client";

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
  direction = "flex-row",
  gap = 2,
  align = "center",
  justify = "start",
  wrap = false,
  ...props
}: StackProps) {
  const gapStyle =
    typeof gap === "number"
      ? { gap: `${gap * 0.25}rem` }
      : typeof gap === "string"
      ? { gap }
      : undefined;

  return (
    <div
      className={[
        "flex",
        direction,
        alignClass[align],
        justifyClass[justify],
        wrap ? "flex-wrap" : "flex-nowrap",
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
  return <Stack direction="flex-row" {...props} />;
}

export function Vstack(props: VstackProps) {
  return <Stack direction="flex-col" {...props} />;
}
