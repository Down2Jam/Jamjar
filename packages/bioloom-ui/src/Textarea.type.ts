export type TextareaSize = "xs" | "sm" | "md" | "lg";
export type TextareaVariant = "standard";
export type LabelPlacement = "outside" | "inside" | "none";

export type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> & {
  size?: TextareaSize;
  variant?: TextareaVariant;
  fullWidth?: boolean;
  label?: string;
  labelPlacement?: LabelPlacement;
  onValueChange?: (val: string) => void;
  placeholder?: string;
};
