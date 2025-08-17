"use client";

import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";

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
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  subtitle,
  children,
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
        onClick={() => setOpen((o) => !o)}
        className="flex w-full justify-between px-4 py-3 text-left"
        style={{ color: colors.text }}
      >
        <div className="flex flex-col gap-1">
          <Text weight="medium">{title}</Text>
          {subtitle && (
            <Text size="sm" color="textFaded">
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
          maxHeight: open ? "1000px" : "0px",
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
