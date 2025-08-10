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
  direction?: "row" | "col";
}

export interface HstackProps extends StackBaseProps {
  direction?: "row";
}

export interface VstackProps extends StackBaseProps {
  direction?: "col";
}
