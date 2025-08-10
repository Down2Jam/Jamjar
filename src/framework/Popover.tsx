"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import useHasMounted from "@/hooks/useHasMounted";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState, useMemo } from "react";

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
  shown: boolean;
  showCloseButton?: boolean;
  offset?: number;
}

export default function Popover({
  children,
  className,
  position = "bottom",
  anchorToScreen = true,
  shown,
  showCloseButton = false,
  offset = 8,
}: PopoverProps) {
  const { colors } = useTheme();
  const hasMounted = useHasMounted();
  const [hovered, setHovered] = useState(false);
  const [closed, setClosed] = useState(false);

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

  // ----- Positioner (no animation, no transforms from Framer)
  const positionerStyle: React.CSSProperties = useMemo(() => {
    if (anchorToScreen) {
      const base: React.CSSProperties = {
        position: "fixed",
        zIndex: 50,
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
        zIndex: 50,
        pointerEvents: "none",
      };
      switch (position) {
        case "top-left":
          return { ...base, bottom: "100%", left: 0, marginBottom: offset };
        case "top-right":
          return { ...base, bottom: "100%", right: 0, marginBottom: offset };
        case "bottom-left":
          return { ...base, top: "100%", left: 0, marginTop: offset };
        case "bottom-right":
          return { ...base, top: "100%", right: 0, marginTop: offset };
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

  if (!hasMounted) return null;

  const content = (
    <div style={positionerStyle}>
      <AnimatePresence initial={false}>
        {shown && !closed && (
          <motion.div
            key="popover"
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              transformOrigin: getTransformOrigin(position),
              pointerEvents: "auto",
              position: "relative",
              // sizing fixes
              display: "inline-block",
              width: "max-content",
              minWidth: "max-content",
              // optional: keep from blowing past viewport when anchored to screen
              maxWidth: anchorToScreen
                ? `calc(100vw - ${offset * 2}px)`
                : undefined,
              backgroundColor: colors["mantle"],
              borderColor: colors["base"],
              color: colors["text"],
              borderWidth: 1,
              borderStyle: "solid",
              borderRadius: 8,
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
              padding: hovered && showCloseButton ? 12 : 8,
              transition: "padding 150ms ease-out",
            }}
            className={className}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* wrapper to ensure absolutely-positioned children don't collapse the parent */}
            <div style={{ position: "relative" }}>{children}</div>

            {showCloseButton && (
              <button
                onClick={() => setClosed(true)}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  padding: 4,
                  borderRadius: 8,
                  backgroundColor: colors["mantle"],
                  color: colors["text"],
                  boxShadow:
                    "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
                  transform: hovered ? "scale(1.05)" : "scale(1)",
                  opacity: hovered ? 1 : 0,
                  transition: "opacity 200ms ease, transform 200ms ease",
                  cursor: "pointer",
                  border: "none",
                }}
                aria-label="Close"
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return anchorToScreen ? createPortal(content, document.body) : content;
}
