"use client";

import * as React from "react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Button } from "./Button";
import { IconName } from "./Icon";

type TabsVariant = "bordered" | "soft";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TabsVariant;
  defaultIndex?: number;
  index?: number;
  onIndexChange?: (i: number) => void;
  fullWidth?: boolean;
  wrap?: boolean;
}

export interface TabProps {
  title: React.ReactNode;
  icon: IconName;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Tabs({
  children,
  className = "",
  defaultIndex = 0,
  index,
  onIndexChange,
  fullWidth = false,
  wrap = true,
  ...rest
}: TabsProps) {
  const { colors } = useTheme();
  const items = React.Children.toArray(
    children
  ) as React.ReactElement<TabProps>[];

  const uncontrolled = index === undefined;
  const [internal, setInternal] = React.useState(defaultIndex);
  const active = uncontrolled ? internal : index!;

  const setActive = (i: number) => {
    if (uncontrolled) setInternal(i);
    onIndexChange?.(i);
  };

  return (
    <div className={["w-full", className].join(" ")} {...rest}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={[
          "flex gap-x-2 mb-2",
          wrap
            ? "flex-wrap content-start gap-y-2 overflow-x-visible"
            : "overflow-x-auto no-scrollbar",
          fullWidth && !wrap ? "justify-between" : "",
        ].join(" ")}
      >
        {items.map((child, i) => {
          const isActive = i === active;
          const disabled = !!child.props.disabled;

          return (
            <Button
              key={i}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${i}`}
              id={`tab-${i}`}
              disabled={disabled}
              onClick={() => !disabled && setActive(i)}
              icon={child.props.icon}
              color={isActive ? "blue" : "default"}
            >
              {child.props.title}
            </Button>
          );
        })}
      </div>

      <div
        id={`panel-${active}`}
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        className="pt-3"
        style={{ color: colors.text }}
      >
        {items[active]}
      </div>
    </div>
  );
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}
