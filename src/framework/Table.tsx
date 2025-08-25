"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";

interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  classNames?: {
    wrapper?: string;
    table?: string;
    thead?: string;
    tbody?: string;
  };
  bottomContent?: React.ReactNode;
}

export function Table({
  children,
  className = "",
  classNames,
  bottomContent,
  ...rest
}: TableProps) {
  const { colors } = useTheme();

  return (
    <div
      className={[
        "rounded-xl border shadow-md overflow-hidden",
        classNames?.wrapper ?? "",
        className,
      ].join(" ")}
      style={{
        backgroundColor: colors.mantle,
        borderColor: colors.base,
        color: colors.text,
      }}
      {...rest}
    >
      <div className="overflow-x-auto">
        <table
          className={["w-full border-collapse", classNames?.table ?? ""].join(
            " "
          )}
          style={{ color: colors.text }}
        >
          {children}
        </table>
      </div>

      {bottomContent && (
        <div className="p-2 border-t" style={{ borderColor: colors.base }}>
          {bottomContent}
        </div>
      )}
    </div>
  );
}

export function TableHeader({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  const { colors } = useTheme();
  return (
    <thead
      className={className}
      style={{ backgroundColor: colors.base }}
      {...rest}
    >
      <tr>{children}</tr>
    </thead>
  );
}

export function TableColumn({
  children,
  className = "",
  style,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const { colors } = useTheme();
  return (
    <th
      className={["text-left text-xs font-medium uppercase", className].join(
        " "
      )}
      style={{
        color: colors.text,
        padding: "0.5rem 0.75rem",
        borderBottom: `1px solid ${colors.base}`,
        ...style,
      }}
      scope="col"
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableBody({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = "",
  style,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement>) {
  const { colors } = useTheme();
  return (
    <tr
      className={["transition-colors", className].join(" ")}
      style={{
        borderBottom: `1px solid ${colors.base}`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = "",
  style,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={["align-middle", className].join(" ")}
      style={{ padding: "0.5rem 0.75rem", ...style }}
      {...rest}
    >
      {children}
    </td>
  );
}
