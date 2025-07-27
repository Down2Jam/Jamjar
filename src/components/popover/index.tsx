"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import useHasMounted from "@/hooks/useHasMounted";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

interface PopoverProps {
  children: React.ReactNode;
  className?: string;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "center";
  anchorToScreen?: boolean;
  shown: boolean;
  showCloseButton?: boolean;
}

export default function Popover({
  children,
  className,
  position = "bottom",
  anchorToScreen = true,
  shown,
  showCloseButton = false,
}: PopoverProps) {
  const { siteTheme } = useTheme();
  const hasMounted = useHasMounted();

  const [closed, setClosed] = useState<boolean>(false);

  const screenPositionClasses: Record<string, string> = {
    "top-left": "fixed top-4 left-4",
    "top-right": "fixed top-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
    "bottom-right": "fixed bottom-4 right-4",
    top: "fixed top-4 left-1/2 -translate-x-1/2",
    bottom: "fixed bottom-4 left-1/2",
    left: "fixed top-1/2 left-4 -translate-y-1/2",
    right: "fixed top-1/2 right-4 -translate-y-1/2",
    center: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  const relativePositionClasses: Record<string, string> = {
    "top-left": "absolute bottom-full left-0 mb-2",
    "top-right": "absolute bottom-full right-0 mb-2",
    "bottom-left": "absolute top-full left-0 mt-2",
    "bottom-right": "absolute top-full right-0 mt-2",
    top: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "absolute left-1/2 mt-2",
    left: "absolute right-full top-1/2 -translate-y-1/2 mr-2",
    right: "absolute left-full top-1/2 -translate-y-1/2 ml-2",
    center: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  const getTransformOrigin = (position: string): string => {
    switch (position) {
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
      case "center":
      default:
        return "center";
    }
  };

  const positionClass = anchorToScreen
    ? screenPositionClasses[position]
    : relativePositionClasses[position];

  if (!hasMounted) return null;

  const content = (
    <AnimatePresence>
      {shown && !closed && (
        <motion.div
          key="popover"
          initial={{
            opacity: 0,
            scale: 0.95,
            padding: 8,
            x: anchorToScreen ? undefined : "-50%",
          }}
          animate={{
            opacity: 1,
            scale: 1,
            padding: 8,
            x: anchorToScreen ? undefined : "-50%",
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            padding: 8,
            x: anchorToScreen ? undefined : "-50%",
          }}
          {...(showCloseButton ? { whileHover: { padding: 12 } } : {})}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            backgroundColor: siteTheme.colors["crust"],
            borderColor: siteTheme.colors["mantle"],
            color: siteTheme.colors["text"],
            transformOrigin: getTransformOrigin(position),
            borderWidth: "1px",
            borderStyle: "solid",
            borderRadius: "0.5rem",
          }}
          className={`w-fit group z-50 shadow-lg transition-colors duration-500 ${positionClass} ${
            className || ""
          }`}
        >
          {showCloseButton && (
            <button
              onClick={() => {
                setClosed(true);
              }}
              className="absolute -top-3 -right-3 bg-black text-white p-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-neutral-800"
              aria-label="Close popover"
            >
              <X size={16} />
            </button>
          )}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return anchorToScreen ? createPortal(content, document.body) : content;
}
