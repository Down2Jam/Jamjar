"use client";

import { useTheme } from "./theme";
import useHasMounted from "./useHasMounted";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";

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

interface PopoverProps {
  children: React.ReactNode;
  className?: string;
  position?: Position;
  anchorToScreen?: boolean;
  startsShown?: boolean;
  shown?: boolean;
  showCloseButton?: boolean;
  closeButtonPosition?: Position;
  closeButtonAlwaysVisible?: boolean;
  closeButtonInside?: boolean;
  closeButtonInset?: number;
  offset?: number;
  padding?: number | string;
  paddingX?: number | string;
  paddingY?: number | string;
  glass?: boolean;
  backdrop?: boolean;
  backdropColor?: string;
  onClose?: () => void;
  onShownChange?: (val: boolean) => void;
  onHoverChange?: (val: boolean) => void;
  positionerStyle?: React.CSSProperties;
  transformOrigin?: string;
  disableHoverScale?: boolean;
  showArrow?: boolean;
  instant?: boolean;
  interactive?: boolean;
  surface?: "default" | "contrast" | "card" | "transparent";
  borderless?: boolean;
}

export default function Popover({
  children,
  className,
  position = "bottom",
  anchorToScreen = true,
  startsShown = false,
  shown: controlledShown,
  showCloseButton = false,
  closeButtonPosition = "top-right",
  closeButtonAlwaysVisible = false,
  closeButtonInside = false,
  closeButtonInset = 8,
  offset = 8,
  padding = 8,
  paddingX,
  paddingY,
  glass = false,
  backdrop = false,
  backdropColor = "rgba(0, 0, 0, 0.5)",
  onClose,
  onShownChange,
  onHoverChange,
  positionerStyle: positionerStyleProp,
  transformOrigin,
  disableHoverScale = false,
  showArrow: showArrowProp,
  instant = false,
  interactive = true,
  surface = "contrast",
  borderless = false,
}: PopoverProps) {
  const { colors } = useTheme();
  const hasMounted = useHasMounted();
  const [hovered, setHovered] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);
  const [internalShown, setInternalShown] = useState<boolean>(startsShown);
  const onHoverChangeRef = useRef(onHoverChange);

  const isControlled = controlledShown === undefined;
  const shown = isControlled ? internalShown : controlledShown;

  const setShown = useCallback(
    (val: boolean) => {
      setInternalShown(val);
      onShownChange?.(val);
    },
    [onShownChange]
  );

  useEffect(() => {
    onHoverChangeRef.current = onHoverChange;
  }, [onHoverChange]);

  useEffect(() => {
    onHoverChangeRef.current?.(hovered);
  }, [hovered]);

  const getTransformOrigin = (p: Position) => {
    switch (p) {
      case "top-left":
        return "bottom left";
      case "top-right":
        return "bottom right";
      case "bottom-left":
        return "top left";
      case "bottom-right":
        return "top right";
      case "top":
        return "bottom center";
      case "bottom":
        return "top center";
      case "left":
        return "center right";
      case "right":
        return "center left";
      default:
        return "center";
    }
  };

  const closeStyle: React.CSSProperties = useMemo(() => {
    const closeOffset = closeButtonInside ? closeButtonInset : -8;

    switch (closeButtonPosition) {
      case "top-right":
        return { top: closeOffset, right: closeOffset };
      case "top-left":
      default:
        return { top: closeOffset, left: closeOffset };
    }
  }, [closeButtonInside, closeButtonInset, closeButtonPosition]);
  const hoverScale =
    hovered && showCloseButton && !disableHoverScale ? 1.015 : 1;
  const showArrow = showArrowProp ?? position !== "center";

  const surfaceBackgroundColor = glass
    ? "rgba(8, 12, 20, 0.55)"
    : surface === "transparent"
      ? "transparent"
    : surface === "card"
      ? `color-mix(in srgb, ${colors["mantle"]} 98%, transparent)`
    : surface === "contrast"
      ? colors["crust"]
      : colors["mantle"];
  const surfaceBorderColor = glass
    ? "rgba(255, 255, 255, 0.15)"
    : surface === "transparent"
      ? "transparent"
    : surface === "card"
      ? `color-mix(in srgb, ${colors["text"]} 5%, transparent)`
    : surface === "contrast"
      ? `color-mix(in srgb, ${colors["text"]} 12%, ${colors["crust"]})`
      : colors["base"];
  const surfaceShadow =
    surface === "transparent"
      ? "none"
      : surface === "card"
      ? "0 24px 60px rgba(0, 0, 0, 0.48), 0 8px 24px rgba(0, 0, 0, 0.32)"
      : surface === "contrast"
      ? "0 12px 28px rgba(0, 0, 0, 0.38), 0 2px 8px rgba(0, 0, 0, 0.28)"
      : "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)";

  const getArrowStyle = (p: Position): React.CSSProperties => {
    const arrowSize = 10;
    const base: React.CSSProperties = {
      position: "absolute",
      width: arrowSize,
      height: arrowSize,
      backgroundColor: surfaceBackgroundColor,
      borderColor: borderless ? "transparent" : surfaceBorderColor,
      borderStyle: "solid",
      zIndex: 0,
      pointerEvents: "none",
    };

    switch (p) {
      case "top-left":
      case "top-right":
      case "top":
        return {
          ...base,
          bottom: -6,
          left: p === "top-right" ? undefined : p === "top-left" ? 16 : "50%",
          right: p === "top-right" ? 16 : undefined,
          transform: p === "top" ? "translateX(-50%) rotate(45deg)" : "rotate(45deg)",
          borderWidth: "0 1px 1px 0",
        };
      case "bottom-left":
      case "bottom-right":
      case "bottom":
        return {
          ...base,
          top: -6,
          left: p === "bottom-right" ? 16 : p === "bottom-left" ? undefined : "50%",
          right: p === "bottom-left" ? 16 : undefined,
          transform: p === "bottom" ? "translateX(-50%) rotate(45deg)" : "rotate(45deg)",
          borderWidth: "1px 0 0 1px",
        };
      case "left":
        return {
          ...base,
          right: -6,
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
          borderWidth: "1px 1px 0 0",
        };
      case "right":
        return {
          ...base,
          left: -6,
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
          borderWidth: "0 0 1px 1px",
        };
      default:
        return base;
    }
  };

  // ----- Positioner (no animation, no transforms from Framer)
  const computedPositionerStyle: React.CSSProperties = useMemo(() => {
    if (anchorToScreen) {
      const base: React.CSSProperties = {
        position: "fixed",
        zIndex: 80,
        pointerEvents: "none",
      };
      switch (position) {
        case "top-left":
          return { ...base, top: offset, left: offset };
        case "top-right":
          return { ...base, top: offset, right: offset };
        case "bottom-left":
          return { ...base, bottom: offset, left: offset };
        case "bottom-right":
          return { ...base, bottom: offset, right: offset };
        case "top":
          return {
            ...base,
            top: offset,
            left: "50%",
            transform: "translateX(-50%)",
          };
        case "bottom":
          return {
            ...base,
            bottom: offset,
            left: "50%",
            transform: "translateX(-50%)",
          };
        case "left":
          return {
            ...base,
            left: offset,
            top: "50%",
            transform: "translateY(-50%)",
          };
        case "right":
          return {
            ...base,
            right: offset,
            top: "50%",
            transform: "translateY(-50%)",
          };
        default:
          return {
            ...base,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          };
      }
    } else {
      // Relative to trigger container (parent must be position: relative)
      const base: React.CSSProperties = {
        position: "absolute",
        zIndex: 80,
        pointerEvents: "none",
      };
      switch (position) {
        case "top-left":
          return { ...base, bottom: "100%", left: 0, marginBottom: offset };
        case "top-right":
          return { ...base, bottom: "100%", right: 0, marginBottom: offset };
        case "bottom-left":
          return { ...base, top: "100%", right: 0, marginTop: offset };
        case "bottom-right":
          return { ...base, top: "100%", left: 0, marginTop: offset };
        case "top":
          return {
            ...base,
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: offset,
          };
        case "bottom":
          return {
            ...base,
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: offset,
          };
        case "left":
          return {
            ...base,
            right: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            marginRight: offset,
          };
        case "right":
          return {
            ...base,
            left: "100%",
            top: "50%",
            transform: "translateY(-50%)",
            marginLeft: offset,
          };
        default:
          return {
            ...base,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          };
      }
    }
  }, [anchorToScreen, position, offset]);
  const positionerStyle = positionerStyleProp ?? computedPositionerStyle;

  if (!hasMounted) return null;

  const toCssValue = (value?: number | string) =>
    value === undefined
      ? undefined
      : typeof value === "number"
      ? `${value}px`
      : value;

  const resolvedPaddingX = paddingX ?? padding;
  const resolvedPaddingY = paddingY ?? padding;

  const content = (
    <div style={positionerStyle}>
      <AnimatePresence initial={false}>
        {shown && !closed && (
          <motion.div
            key="popover"
            layout
            initial={instant ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: hoverScale }}
            exit={
              instant
                ? { opacity: 0, scale: hoverScale }
                : { opacity: 0, scale: 0.95 }
            }
            transition={{ duration: instant ? 0 : 0.2, ease: "easeOut" }}
            style={{
              transformOrigin: transformOrigin ?? getTransformOrigin(position),
              pointerEvents: interactive ? "auto" : "none",
              position: "relative",
              zIndex: 1,
              // sizing fixes
              display: "inline-block",
              width: "max-content",
              minWidth: "max-content",
              // optional: keep from blowing past viewport when anchored to screen
              maxWidth: anchorToScreen
                ? `calc(100vw - ${offset * 2}px)`
                : undefined,
              color: colors["text"],
              borderWidth: borderless ? 0 : 1,
              borderStyle: "solid",
              borderRadius: 8,
              boxShadow: surfaceShadow,
              backgroundColor: surfaceBackgroundColor,
              borderColor: surfaceBorderColor,
              backdropFilter: glass ? "blur(12px) saturate(120%)" : undefined,
              WebkitBackdropFilter: glass
                ? "blur(12px) saturate(120%)"
                : undefined,
              paddingLeft: toCssValue(resolvedPaddingX),
              paddingRight: toCssValue(resolvedPaddingX),
              paddingTop: toCssValue(resolvedPaddingY),
              paddingBottom: toCssValue(resolvedPaddingY),
            }}
            className={className}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {showArrow && <div aria-hidden="true" style={getArrowStyle(position)} />}
            {/* wrapper to ensure absolutely-positioned children don't collapse the parent */}
            <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
            {showCloseButton && (
              <button
                onClick={() => {
                  if (onClose) {
                    onClose();
                  }
                  setShown(false);
                }}
                style={{
                  position: "absolute",
                  zIndex: 2,
                  width: 32,
                  height: 32,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  borderRadius: 8,
                  backgroundColor:
                    closeHovered
                      ? colors["base"]
                      : surface === "transparent"
                      ? colors["crust"]
                      : "transparent",
                  color: colors["text"],
                  border: "1px solid transparent",
                  boxShadow: "none",
                  opacity: closeButtonAlwaysVisible || hovered ? 1 : 0,
                  transition: "opacity 200ms ease, background-color 200ms ease",
                  cursor: "pointer",
                  ...closeStyle,
                }}
                onMouseEnter={() => setCloseHovered(true)}
                onMouseLeave={() => setCloseHovered(false)}
                aria-label="Close"
                type="button"
              >
                <X
                  size={16}
                  style={{
                    transform: closeHovered ? "scale(1.15)" : "scale(1)",
                    transition: "transform 150ms ease",
                  }}
                />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (!anchorToScreen) return content;

  return createPortal(
    <>
      <AnimatePresence initial={false}>
        {backdrop && shown && (
          <motion.div
            key="popover-backdrop"
            className="fixed inset-0"
            style={{ backgroundColor: backdropColor, zIndex: 40 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => {
              onClose?.();
              setShown(false);
            }}
          />
        )}
      </AnimatePresence>
      {content}
    </>,
    document.body
  );
}
