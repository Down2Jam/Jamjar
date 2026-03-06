"use client";

import * as React from "react";
import { useTheme } from "./theme";

type NavbarMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  maxWidth?: NavbarMaxWidth;
  height?: number | string;
  isBordered?: boolean;
}

const maxWidthMap: Record<NavbarMaxWidth, string> = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  full: "100%",
};

export function Navbar({
  maxWidth = "full",
  height,
  isBordered = false,
  className = "",
  style,
  children,
  ...props
}: NavbarProps) {
  const { colors } = useTheme();
  const resolvedHeight =
    typeof height === "number" ? `${height}px` : height ?? undefined;

  const mergedStyle: React.CSSProperties = {
    backgroundColor: colors["crust"],
    ...(resolvedHeight ? { height: resolvedHeight } : {}),
    ...style,
  };

  if (isBordered && !mergedStyle.borderColor) {
    mergedStyle.borderColor = colors["base"];
  }

  const borderClass = isBordered ? "border-b" : "";

  return (
    <nav
      className={[
        "w-full flex items-center relative z-20",
        borderClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={mergedStyle}
      {...props}
    >
      <div
        className="mx-auto w-full flex items-center justify-between gap-2"
        style={{ maxWidth: maxWidthMap[maxWidth] }}
      >
        {children}
      </div>
    </nav>
  );
}

interface NavbarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: "start" | "center" | "end";
}

export function NavbarContent({
  justify = "start",
  className = "",
  ...props
}: NavbarContentProps) {
  const justifyClass =
    justify === "center"
      ? "justify-center"
      : justify === "end"
      ? "justify-end"
      : "justify-start";

  return (
    <div
      className={["flex items-center gap-2", justifyClass, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

interface NavbarItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function NavbarItem({ className = "", ...props }: NavbarItemProps) {
  return (
    <div
      className={["flex items-center", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

interface NavbarBrandProps extends React.HTMLAttributes<HTMLDivElement> {}

export function NavbarBrand({ className = "", ...props }: NavbarBrandProps) {
  return (
    <div
      className={["flex items-center", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
