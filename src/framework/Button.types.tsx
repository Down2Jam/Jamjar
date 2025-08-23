import { IconName } from "./Icon";

export type ButtonVariant = "standard";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

type Shared = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: IconName;
  color?: "default" | "blue" | "green" | "pink" | "red" | "yellow" | "gray";
  externalIcon?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  kbd?: string;
};

export type ButtonAsButton = Shared &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export type ButtonAsLink = Shared &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    target?: "_blank" | "_self" | "_parent" | "_top";
    rel?: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;
