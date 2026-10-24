"use client";

import React, {
  Children,
  createContext,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Popover from "./Popover";
import { useTheme } from "./theme";
import { Backdrop } from "./Backdrop";
import Icon, { IconName } from "./Icon";
import { Chip } from "./Chip";
import { ExternalLink } from "lucide-react";
import Text from "./Text";
import { Hstack } from "./Stack";
import { Button } from "./Button";
import { ButtonSize, ButtonVariant } from "./Button.types";

const isExternalHref = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://");

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

function isDropdownItemElement(
  node: ReactNode
): node is ReactElement<ItemProps, typeof DropdownItem> {
  if (!isValidElement(node)) return false;
  const component = node.type as { displayName?: string; name?: string };
  return node.type === DropdownItem || component.displayName === "DropdownItem" || component.name === "DropdownItem";
}

function isElementWithChildren(
  node: ReactNode
): node is ReactElement<{ children?: ReactNode }> {
  return isValidElement(node);
}

function findSelectedDisplay(
  nodes: ReactNode,
  selectedValue: unknown
): { label?: ReactNode; icon?: IconName } | null {
  for (const child of Children.toArray(nodes)) {
    if (isDropdownItemElement(child)) {
      if (child.props.value === selectedValue) {
        return { label: child.props.children, icon: child.props.icon };
      }
    } else if (isElementWithChildren(child) && child.props?.children) {
      const found = findSelectedDisplay(child.props.children, selectedValue);
      if (found) return found;
    }
  }
  return null;
}

function collectOptionValues(nodes: ReactNode): unknown[] {
  return Children.toArray(nodes).flatMap(child => {
    if (isDropdownItemElement(child)) return child.props.disabled || child.props.value === undefined ? [] : [child.props.value];
    return isElementWithChildren(child) ? collectOptionValues(child.props.children) : [];
  });
}

function collectOptionDisplays(nodes: ReactNode): Array<{ label: ReactNode; icon?: IconName }> {
  return Children.toArray(nodes).flatMap(child => {
    if (isDropdownItemElement(child)) return [{ label: child.props.children, icon: child.props.icon }];
    return isElementWithChildren(child) ? collectOptionDisplays(child.props.children) : [];
  });
}

interface DropdownContextValue {
  closeOnSelect: boolean;
  onItemSelect?: (value: unknown) => void;
  setOpen: (v: boolean) => void;
  multiple: boolean;
  multipleWithModifiers: boolean;
  selectionAnchor: React.MutableRefObject<unknown>;
  optionValues: unknown[];
  selectedValues: Set<unknown>;
  setSelectedValues: (set: Set<unknown>) => void;

  // let items tell the dropdown what to display in the default trigger
  setSelectedDisplay: (
    display: { label?: ReactNode; icon?: IconName } | null
  ) => void;
}

const DropdownCtx = createContext<DropdownContextValue | null>(null);
const useDropdownCtx = () => {
  const ctx = useContext(DropdownCtx);
  if (!ctx) throw new Error("Dropdown.Item must be used inside Dropdown");
  return ctx;
};

interface DropdownProps {
  trigger?: React.ReactNode; // optional, if ommited does a default button
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
  multiple?: boolean;
  multipleWithModifiers?: boolean;
  clearSelectionLabel?: string;
  selectedValue?: unknown;
  selectedValues?: Set<unknown>;
  onSelectionChange?: (selected: Set<unknown>) => void;
  disabled?: boolean;

  placeholder?: string;
  showChevron?: boolean;
  fitLongestOption?: boolean;
  sizingOptions?: Array<{ label: ReactNode; icon?: IconName }>;
  triggerSize?: ButtonSize;
  triggerVariant?: ButtonVariant;
  triggerClassName?: string;
  triggerChevronClassName?: string;
  matchTriggerWidth?: boolean;
  arrowToChevron?: boolean;
  triggerIcon?: IconName;
  triggerStyle?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
  freezePositionWhileOpen?: boolean;
  instant?: boolean;
  portal?: boolean;
}

function Dropdown({
  trigger,
  children,
  position = "bottom",
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
  multiple = false,
  multipleWithModifiers = false,
  clearSelectionLabel,
  selectedValues: controlledSelectedValues,
  onSelectionChange,
  disabled = false,
  selectedValue,
  placeholder = "Select",
  showChevron = true,
  fitLongestOption = false,
  sizingOptions = [],
  triggerSize = "md",
  triggerVariant = "standard",
  triggerClassName = "",
  triggerChevronClassName,
  matchTriggerWidth = false,
  arrowToChevron = false,
  triggerIcon,
  triggerStyle,
  menuStyle,
  freezePositionWhileOpen = false,
  instant = false,
  portal = false,
}: DropdownProps) {
  const useViewportAnchor = portal || freezePositionWhileOpen;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [resolvedPosition, setResolvedPosition] = useState(position);
  const [availableMenuHeight, setAvailableMenuHeight] = useState<number>();
  const selectionAnchor = useRef<unknown>(undefined);
  const optionValues = collectOptionValues(children);
  const [frozenAnchorRect, setFrozenAnchorRect] = useState<DOMRect | null>(null);
  const [internalSelectedValues, setInternalSelectedValues] = useState<
    Set<unknown>
  >(new Set());

  const [selectedDisplay, setSelectedDisplay] = useState<{
    label?: ReactNode;
    icon?: IconName;
  } | null>(null);

  const resolvedSelectedDisplay = useMemo(() => {
    if (multiple) return null;
    if (selectedValue !== undefined) {
      return findSelectedDisplay(children, selectedValue);
    }
    return selectedDisplay;
  }, [children, multiple, selectedValue, selectedDisplay]);

  const selectedValues = useMemo(
    () => controlledSelectedValues ?? internalSelectedValues,
    [controlledSelectedValues, internalSelectedValues]
  );

  const setSelectedValues = (newValues: Set<unknown>) => {
    if (!controlledSelectedValues) {
      setInternalSelectedValues(new Set(newValues));
    }
    onSelectionChange?.(new Set(newValues));
  };

  const open = (isOpen ?? internalOpen) && !disabled;

  useLayoutEffect(() => {
    if (!open) {
      setResolvedPosition(position);
      setAvailableMenuHeight(undefined);
      return;
    }
    const menu = menuRef.current;
    const anchor = rootRef.current;
    if (!menu || !anchor) return;

    const updatePlacement = () => {
      if (!position.startsWith("top") && !position.startsWith("bottom")) return;
      const rect = freezePositionWhileOpen && frozenAnchorRect ? frozenAnchorRect : anchor.getBoundingClientRect();
      const above = Math.max(0, rect.top - 16);
      const below = Math.max(0, window.innerHeight - rect.bottom - 16);
      const panel = menu.parentElement?.parentElement;
      const chrome = panel ? Math.max(0, panel.offsetHeight - menu.offsetHeight) : 18;
      const height = Math.min(320, menu.scrollHeight) + chrome;
      const prefersTop = position.startsWith("top");
      const useTop = prefersTop ? !(height > above && below > above) : height > below && above > below;
      // Top and bottom corner names use opposite horizontal alignment conventions.
      const flipped: Partial<Record<Position, Position>> = {
        bottom: "top", "bottom-left": "top-right", "bottom-right": "top-left",
        top: "bottom", "top-left": "bottom-right", "top-right": "bottom-left",
      };
      setResolvedPosition(useTop === prefersTop ? position : flipped[position] ?? position);
      setAvailableMenuHeight(Math.max(0, (useTop ? above : below) - chrome));
    };

    updatePlacement();
    const observer = new ResizeObserver(updatePlacement);
    observer.observe(menu);
    observer.observe(anchor);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, position, freezePositionWhileOpen, frozenAnchorRect, children]);

  const supportsClick = openOn === "click" || openOn === "both";
  const supportsHover = openOn === "hover" || openOn === "both";


  const setOpenAndNotify = useCallback(
    (value: boolean) => {
      if (useViewportAnchor && value && rootRef.current) {
        setFrozenAnchorRect(rootRef.current.getBoundingClientRect());
      }
      if (isOpen === undefined) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [useViewportAnchor, isOpen, onOpenChange]
  );

  useEffect(() => {
    if (open && useViewportAnchor && !frozenAnchorRect && rootRef.current) {
      setFrozenAnchorRect(rootRef.current.getBoundingClientRect());
    }
  }, [useViewportAnchor, frozenAnchorRect, open]);

  useEffect(() => {
    if (!open || !portal || freezePositionWhileOpen) return;
    const updateAnchor = () => {
      if (rootRef.current) setFrozenAnchorRect(rootRef.current.getBoundingClientRect());
    };
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [open, portal, freezePositionWhileOpen]);

  const frozenPositionerStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!useViewportAnchor || !frozenAnchorRect) return undefined;

    const offset = 8;
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex: 80,
      pointerEvents: "none",
    };
    const centerX = frozenAnchorRect.left + frozenAnchorRect.width / 2;
    const centerY = frozenAnchorRect.top + frozenAnchorRect.height / 2;

    switch (resolvedPosition) {
      case "top-left":
        return {
          ...base,
          bottom: window.innerHeight - frozenAnchorRect.top + offset,
          left: frozenAnchorRect.left,
        };
      case "top-right":
        return {
          ...base,
          bottom: window.innerHeight - frozenAnchorRect.top + offset,
          right: window.innerWidth - frozenAnchorRect.right,
        };
      case "top":
        return {
          ...base,
          bottom: window.innerHeight - frozenAnchorRect.top + offset,
          left: centerX,
          transform: "translateX(-50%)",
        };
      case "bottom-left":
        return {
          ...base,
          top: frozenAnchorRect.bottom + offset,
          right: window.innerWidth - frozenAnchorRect.right,
        };
      case "bottom-right":
        return {
          ...base,
          top: frozenAnchorRect.bottom + offset,
          left: frozenAnchorRect.left,
        };
      case "left":
        return {
          ...base,
          right: window.innerWidth - frozenAnchorRect.left + offset,
          top: centerY,
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          ...base,
          left: frozenAnchorRect.right + offset,
          top: centerY,
          transform: "translateY(-50%)",
        };
      case "center":
        return {
          ...base,
          top: centerY,
          left: centerX,
          transform: "translate(-50%, -50%)",
        };
      case "bottom":
      default:
        return {
          ...base,
          top: frozenAnchorRect.bottom + offset,
          left: centerX,
          transform: "translateX(-50%)",
        };
    }
  }, [useViewportAnchor, frozenAnchorRect, resolvedPosition]);

  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    const onDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const target = e.target as Node;
      if (!root.contains(target) && !menuRef.current?.contains(target)) {
        setOpenAndNotify(false);
      }
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open, closeOnOutsideClick, setOpenAndNotify]);

  useEffect(() => () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handleMouseEnter = () => {
    if (!supportsHover) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!open) {
      hoverTimeoutRef.current = setTimeout(() => setOpenAndNotify(true), 500);
    }
  };

  const handleMouseLeave = () => {
    if (!supportsHover) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(
      () => setOpenAndNotify(false),
      hoverDelay
    );
  };

  const handleClick = () => {
    if (!supportsClick) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setOpenAndNotify(!open);
  };

  const singleDisplay = multipleWithModifiers && selectedValues.size === 1
    ? findSelectedDisplay(children, selectedValues.values().next().value)
    : null;
  const computedLabel = multiple
    ? selectedValues.size > 0
      ? singleDisplay?.label ?? `${selectedValues.size} selected`
      : placeholder
    : resolvedSelectedDisplay?.label ?? placeholder;

  const computedIcon = multiple
    ? singleDisplay?.icon ?? triggerIcon
    : resolvedSelectedDisplay?.icon ?? triggerIcon;

  const optionDisplays = useMemo(() => fitLongestOption ? collectOptionDisplays(children) : [], [children, fitLongestOption]);
  const renderDefaultTrigger = (display: { label: ReactNode; icon?: IconName } = { label: computedLabel, icon: computedIcon }) => (
    <Button
      aria-haspopup="menu"
      aria-expanded={open}
      icon={display.icon}
      size={triggerSize}
      variant={triggerVariant}
      className={`${triggerClassName} ${fitLongestOption ? "w-full whitespace-nowrap !justify-start text-left [&>p]:flex [&>p]:items-center [&>p]:text-left [&>p>span]:flex [&>p>span]:items-center" : ""}`}
      style={triggerStyle}
      disabled={disabled}
      rightSlot={
        showChevron && (
          triggerChevronClassName ? (
            <span data-dropdown-chevron className={triggerChevronClassName} aria-hidden="true">
              <Icon name="chevrondown" size={16} className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : "rotate-0"}`} />
            </span>
          ) : (
          <Icon
            name="chevrondown"
            size={16}
            className={`${fitLongestOption ? "ml-auto shrink-0" : "ml-2"} transform transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
          )
        )
      }
    >
      {display.label}
    </Button>
  );

  return (
    <div
      ref={rootRef}
      className="relative inline-block"
      style={{ zIndex: open ? 90 : undefined }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div onClick={handleClick} className="cursor-pointer" style={fitLongestOption && !trigger ? { display: "inline-grid", gridTemplateColumns: "max-content" } : undefined}>
        {fitLongestOption && !trigger ? <>
          <div style={{ gridArea: "1 / 1", minWidth: 0 }}>{renderDefaultTrigger()}</div>
          {[{ label: placeholder, icon: triggerIcon }, ...(multiple ? [{ label: `${optionDisplays.length} selected`, icon: triggerIcon }] : []), ...optionDisplays, ...sizingOptions].map((display, index) => (
            <div key={index} aria-hidden="true" inert style={{ gridArea: "1 / 1", visibility: "hidden", pointerEvents: "none" }}>{renderDefaultTrigger(display)}</div>
          ))}
        </> : trigger ?? renderDefaultTrigger()}
      </div>

      {backdrop && (
        <Backdrop shown={open} onClick={() => setOpenAndNotify(false)} />
      )}

      <DropdownCtx.Provider
        value={{
          closeOnSelect,
          onItemSelect: onSelect,
          setOpen: (v) => setOpenAndNotify(v),
          multiple,
          multipleWithModifiers,
          selectionAnchor,
          optionValues,
          selectedValues,
          setSelectedValues,
          setSelectedDisplay, // NEW
        }}
      >
        <Popover
          instant={instant}
          disableHoverScale={instant}
          shown={open}
          anchorRef={rootRef}
          matchAnchorWidth={matchTriggerWidth}
          arrowAnchorSelector={arrowToChevron ? "[data-dropdown-chevron]" : undefined}
          position={resolvedPosition}
          anchorToScreen={useViewportAnchor}
          className={className}
          positionerStyle={frozenPositionerStyle}
          showArrow
        >
          <div
            ref={menuRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="menu"
            aria-orientation="vertical"
            style={{
              maxHeight: "min(20rem, calc(100dvh - 32px))",
              overflowY: "auto",
              overscrollBehaviorY: "contain",
              ...menuStyle,
              ...(availableMenuHeight !== undefined ? { maxHeight: `min(20rem, ${availableMenuHeight}px)` } : {}),
            }}
          >
            {multiple && clearSelectionLabel && (
              <DropdownClearSelection>{clearSelectionLabel}</DropdownClearSelection>
            )}
            {children}
          </div>
        </Popover>
      </DropdownCtx.Provider>
    </div>
  );
}

export interface ItemProps<T = unknown> {
  value?: T;
  children: ReactNode;
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

export function DropdownItem<T = unknown>({
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
  const {
    closeOnSelect,
    onItemSelect,
    setOpen,
    multiple,
    multipleWithModifiers,
    selectionAnchor,
    optionValues,
    selectedValues,
    setSelectedValues,
    setSelectedDisplay,
  } = useDropdownCtx();
  const { colors } = useTheme();

  const isSelected = value !== undefined && selectedValues.has(value);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick?.(e);
    if (e.defaultPrevented) return;

    if (multiple && value !== undefined) {
      const toggle = e.ctrlKey || e.metaKey;
      const additive = !multipleWithModifiers || toggle;
      const newSet = additive || (isSelected && !e.shiftKey)
        ? new Set(selectedValues)
        : new Set<unknown>();
      const anchorIndex = optionValues.indexOf(selectionAnchor.current);
      const targetIndex = optionValues.indexOf(value);
      if (e.shiftKey && anchorIndex >= 0 && targetIndex >= 0) {
        for (const item of optionValues.slice(Math.min(anchorIndex, targetIndex), Math.max(anchorIndex, targetIndex) + 1)) newSet.add(item);
      } else {
        if (isSelected) newSet.delete(value);
        else newSet.add(value);
        selectionAnchor.current = value;
      }
      setSelectedValues(newSet);
      if (!additive && !e.shiftKey && closeOnSelect) setOpen(false);
    } else {
      if (value !== undefined) {
        setSelectedDisplay({ label: children, icon });
      }
      handleSelect();
      if (closeOnSelect && !e.ctrlKey && !e.metaKey) setOpen(false);
    }

    onSelect?.(value as T);
    onItemSelect?.(value);
  };

  const handleSelect = () => {
    onSelect?.(value as T);
    onItemSelect?.(value);
  };

  const commonClass = [
    "flex w-full cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50 justify-between",
    className,
  ].join(" ");

  const commonStyle: React.CSSProperties = {
    color: colors["text"],
    backgroundColor: isSelected ? colors["blueDarkDark"] + "55" : "transparent",
  };

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {icon && <Icon size={16} name={icon} className="shrink-0" />}
        <span className="flex min-w-0 flex-1 flex-col">
          <Text>{children}</Text>
          {description && (
            <Text color="textFaded" size="xs" className="max-w-full">
              {description}
            </Text>
          )}
        </span>
      </div>
      {kbd && <Chip className="shrink-0">{kbd}</Chip>}
    </>
  );

  // Link mode
  if (href) {
    const isExternal = isExternalHref(href);

    const relValue =
      rel ??
      (target === "_blank" && isExternal ? "noopener noreferrer" : undefined);

    return (
      <a
        href={href}
        className={commonClass}
        style={commonStyle}
        onClick={handleClick}
        target={target}
        rel={relValue}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = isSelected
            ? colors["blueDark"] + "55"
            : colors["base"];
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = isSelected
            ? colors["blueDarkDark"] + "55"
            : "transparent";
        }}
      >
        {content}
        {isExternal && externalIcon && !kbd && (
          <ExternalLink size={16} className="ml-2 shrink-0" />
        )}
      </a>
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
      style={{
        ...commonStyle,
        color: isSelected ? colors["blue"] : colors["text"],
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          isSelected ? colors["blueDark"] + "55" : colors["base"];
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          isSelected ? colors["blueDarkDark"] + "55" : "transparent";
      }}
    >
      <Hstack justify="between" className="w-full">
        <Hstack className="min-w-0 flex-1">
          {icon && <Icon size={16} name={icon} className="shrink-0" />}
          <span className="flex min-w-0 flex-col">
            <Text>{children}</Text>
            {description && (
              <Text color="textFaded" size="xs">
                {description}
              </Text>
            )}
          </span>
        </Hstack>
        {multiple && isSelected && <Icon name="check" className="ml-auto shrink-0" />}
      </Hstack>
    </button>
  );
}

DropdownItem.displayName = "DropdownItem";

function DropdownClearSelection({ children }: { children: ReactNode }) {
  const { selectionAnchor, setSelectedValues } = useDropdownCtx();
  return <DropdownItem icon="layers" onClick={event => {
    event.preventDefault();
    selectionAnchor.current = undefined;
    setSelectedValues(new Set());
  }}>{children}</DropdownItem>;
}

export default Object.assign(Dropdown, { Item: DropdownItem, ClearSelection: DropdownClearSelection });
