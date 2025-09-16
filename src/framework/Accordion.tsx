"use client";

import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import Icon, { IconName } from "./Icon";

interface AccordionProps {
  children: ReactNode;
  className?: string;
}

export function Accordion({ children, className = "" }: AccordionProps) {
  return (
    <Vstack className={className} align="stretch">
      {children}
    </Vstack>
  );
}

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

interface AccordionItemProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  subtitle,
  children,
  icon,
  defaultOpen = false,
}: AccordionItemProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        border: `1px solid ${colors.base}`,
        borderRadius: 8,
        backgroundColor: colors.mantle,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full justify-between px-4 py-3 text-left"
        style={{ color: colors.text }}
      >
        <div className="flex flex-col gap-1">
          <Hstack>
            {icon && <Icon size={12} name={icon} />}
            <Text weight="medium" size="sm">
              {title}
            </Text>
          </Hstack>
          {subtitle && (
            <Text size="xs" color="textFaded">
              {subtitle}
            </Text>
          )}
        </div>
        <ChevronDown
          size={16}
          style={{
            transform: `rotate(${open ? 180 : 0}deg)`,
            transition: "transform 0.2s ease",
          }}
        />
      </button>
      <div
        style={{
          maxHeight: open ? undefined : "0px", // code here to possibly make it animate, issue is if you set it to a px value so it does it clips things in the game edit page
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div
          className="px-4 py-2 border-t"
          style={{ borderColor: colors.base }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
