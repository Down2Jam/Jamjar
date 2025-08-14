import { IconName } from "./Icon";

export type ButtonVariant = "standard";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

type Shared = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: IconName;
  color?: "default" | "blue" | "green" | "pink" | "red";
  externalIcon?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export type ButtonAsButton = Shared &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export type ButtonAsLink = Shared &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;
