"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Popover from "@/framework/Popover";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Backdrop } from "./Backdrop";
import Icon, { IconName } from "./Icon";
import { useTranslations } from "next-intl";
import { Badge } from "./Badge";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type Position =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center";

interface DropdownContextValue {
  closeOnSelect: boolean;
  onItemSelect?: (value: unknown) => void;
  setOpen: (v: boolean) => void;
}

const DropdownCtx = createContext<DropdownContextValue | null>(null);
const useDropdownCtx = () => {
  const ctx = useContext(DropdownCtx);
  if (!ctx) throw new Error("Dropdown.Item must be used inside Dropdown");
  return ctx;
};

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  position?: Position;
  className?: string;
  openOn?: "hover" | "click" | "both";
  hoverDelay?: number;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean; // controlled
  defaultOpen?: boolean; // uncontrolled
  onSelect?: (value: unknown) => void;
  closeOnSelect?: boolean;
  backdrop?: boolean;
  closeOnOutsideClick?: boolean;
}

function Dropdown({
  trigger,
  children,
  position = "bottom-left",
  className,
  openOn = "click",
  hoverDelay = 150,
  onOpenChange,
  isOpen,
  defaultOpen = false,
  onSelect,
  closeOnSelect = true,
  backdrop = true,
  closeOnOutsideClick = true,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const open = isOpen ?? internalOpen;

  const supportsClick = openOn === "click" || openOn === "both";
  const supportsHover = openOn === "hover" || openOn === "both";

  const setOpenAndNotify = useCallback(
    (value: boolean) => {
      if (isOpen === undefined) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isOpen, onOpenChange]
  );

  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    const onDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) {
        setOpenAndNotify(false);
      }
    };
    // Use capture so it runs before other handlers
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open, closeOnOutsideClick, setOpenAndNotify]);

  const handleMouseEnter = () => {
    if (!supportsHover) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setOpenAndNotify(true);
  };

  const handleMouseLeave = () => {
    if (!supportsHover) return;
    hoverTimeoutRef.current = setTimeout(
      () => setOpenAndNotify(false),
      hoverDelay
    );
  };

  const handleClick = () => {
    if (!supportsClick) return;
    setOpenAndNotify(!open);
  };

  return (
    <div
      ref={rootRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div onClick={handleClick} className="cursor-pointer">
        {trigger}
      </div>

      {backdrop && (
        <Backdrop shown={open} onClick={() => setOpenAndNotify(false)} />
      )}

      <DropdownCtx.Provider
        value={{
          closeOnSelect,
          onItemSelect: onSelect,
          setOpen: (v) => setOpenAndNotify(v),
        }}
      >
        <Popover
          shown={open}
          position={position}
          anchorToScreen={false}
          className={className}
        >
          <div role="menu" aria-orientation="vertical">
            {children}
          </div>
        </Popover>
      </DropdownCtx.Provider>
    </div>
  );
}

interface ItemProps<T = unknown> {
  value?: T;
  children: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
  className?: string;
  onSelect?: (value: T) => void;
  onClick?: (e: React.MouseEvent) => void;
  kbd?: string;
  href?: string;
  externalIcon?: boolean;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
}

function Item<T = unknown>({
  value,
  children,
  description,
  icon,
  disabled = false,
  className = "",
  onSelect,
  onClick,
  kbd,
  href,
  externalIcon = true,
  target,
  rel,
}: ItemProps<T>) {
  const { closeOnSelect, onItemSelect, setOpen } = useDropdownCtx();
  const { colors } = useTheme();
  const t = useTranslations();

  const handleSelect = () => {
    onSelect?.(value as T);
    onItemSelect?.(value);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick?.(e);
    if (e.defaultPrevented) return;

    handleSelect();
    if (closeOnSelect) setOpen(false);
  };

  const commonClass = [
    "flex w-full select-none items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50 justify-between",
    className,
  ].join(" ");

  const commonStyle: React.CSSProperties = {
    color: colors["text"],
    backgroundColor: "transparent",
  };

  const content = (
    <>
      <div className="flex items-center gap-3">
        {icon && <Icon size={16} name={icon} />}
        <span className="flex flex-col">
          {t(children)}
          {description && (
            <span className="text-xs" style={{ color: colors["textFaded"] }}>
              {t(description)}
            </span>
          )}
        </span>
      </div>
      {kbd && <Badge>{kbd}</Badge>}
    </>
  );

  // Link mode
  if (href) {
    const isExternal =
      typeof window !== "undefined" &&
      (() => {
        try {
          const url = new URL(href, window.location.origin);
          return url.origin !== window.location.origin;
        } catch {
          return false;
        }
      })();

    const relValue =
      rel ??
      (target === "_blank" && isExternal ? "noopener noreferrer" : undefined);

    return (
      <Link
        href={href}
        className={commonClass}
        style={commonStyle}
        onClick={handleClick}
        target={target}
        rel={relValue}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            colors["base"];
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            "transparent";
        }}
      >
        {content}
        {isExternal && externalIcon && !kbd && (
          <ExternalLink size={16} className="ml-2 shrink-0" />
        )}
      </Link>
    );
  }

  // Button mode
  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      disabled={disabled}
      className={commonClass}
      style={commonStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          colors["base"];
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          "transparent";
      }}
    >
      {content}
    </button>
  );
}

export default Object.assign(Dropdown, { Item });
