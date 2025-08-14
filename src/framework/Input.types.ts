import { InputHTMLAttributes, ReactNode } from "react";

export type InputSize = "xs" | "sm" | "md" | "lg";
export type InputVariant = "standard";
export type LabelPlacement = "outside" | "inside" | "none";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: InputVariant;
  size?: InputSize;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  label?: string;
  labelPlacement?: LabelPlacement;
  onValueChange?: (value: string) => void;
}
