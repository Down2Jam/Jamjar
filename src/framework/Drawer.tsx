"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Button } from "./Button";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  hideClose?: boolean;
};

export default function Drawer({
  isOpen,
  onClose,
  children,
  header,
  footer,
  hideClose = false,
}: DrawerProps) {
  const { colors } = useTheme();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              backgroundColor: "#00000066",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-4xl flex flex-col shadow-xl"
            style={{ backgroundColor: colors["mantle"] }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            {(header || !hideClose) && (
              <div
                className="flex items-center justify-between px-4 py-2 border-b backdrop-blur-lg"
                style={{
                  borderColor: colors["base"],
                }}
              >
                {header}
                {!hideClose && (
                  <Button icon="x" size="sm" onClick={onClose}>
                    Close
                  </Button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-default-200/50 px-4 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
