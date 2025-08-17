import * as React from "react";

export type Align = "start" | "center" | "end" | "stretch" | "baseline";
export type Justify =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around"
  | "evenly";
export type Gap = number | string;

export interface StackBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
}

export interface StackProps extends StackBaseProps {
  direction?: string;
}

export type HstackProps = Omit<StackProps, "direction">;
export type VstackProps = Omit<StackProps, "direction">;
