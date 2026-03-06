"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "./theme";
import useHasMounted from "./useHasMounted";

export type ToastColor =
  | "default"
  | "success"
  | "danger"
  | "warning"
  | "info";

export type ToastVariant = "solid" | "bordered";

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  color?: ToastColor;
  variant?: ToastVariant;
  timeout?: number;
}

type ToastItem = ToastOptions & {
  id: string;
  createdAt: number;
};

type ToastListener = (toast: ToastItem) => void;

const listeners = new Set<ToastListener>();

const createToastId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function addToast(options: ToastOptions) {
  const toast: ToastItem = {
    id: createToastId(),
    createdAt: Date.now(),
    ...options,
  };
  listeners.forEach((listener) => listener(toast));
  return toast.id;
}

export type ToastPlacement =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastProviderProps {
  placement?: ToastPlacement;
}

export function ToastProvider({ placement = "bottom-right" }: ToastProviderProps) {
  const hasMounted = useHasMounted();
  const { colors } = useTheme();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (toast: ToastItem) => {
      setToasts((prev) => [...prev, toast]);
      const timeout = toast.timeout ?? 3000;
      if (timeout > 0) {
        window.setTimeout(() => removeToast(toast.id), timeout);
      }
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, [removeToast]);

  const placementStyle = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex: 60,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      pointerEvents: "none",
    };

    switch (placement) {
      case "top-left":
        return { ...base, top: 16, left: 16, alignItems: "flex-start" };
      case "top-center":
        return {
          ...base,
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          alignItems: "center",
        };
      case "top-right":
        return { ...base, top: 16, right: 16, alignItems: "flex-end" };
      case "bottom-left":
        return { ...base, bottom: 16, left: 16, alignItems: "flex-start" };
      case "bottom-center":
        return {
          ...base,
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          alignItems: "center",
        };
      case "bottom-right":
      default:
        return { ...base, bottom: 16, right: 16, alignItems: "flex-end" };
    }
  }, [placement]);

  if (!hasMounted) return null;

  const colorMap = {
    default: {
      background: colors["mantle"],
      border: colors["base"],
      text: colors["text"],
    },
    success: {
      background: colors["greenDark"],
      border: colors["green"],
      text: colors["greenLight"],
    },
    danger: {
      background: colors["redDark"],
      border: colors["red"],
      text: colors["redLight"],
    },
    warning: {
      background: colors["yellowDark"],
      border: colors["yellow"],
      text: colors["yellowLight"],
    },
    info: {
      background: colors["blueDark"],
      border: colors["blue"],
      text: colors["blueLight"],
    },
  };

  return createPortal(
    <div style={placementStyle}>
      {toasts.map((toast) => {
        const tone = colorMap[toast.color ?? "default"];
        const variant = toast.variant ?? "solid";
        const baseStyle: React.CSSProperties =
          variant === "bordered"
            ? {
                backgroundColor: colors["crust"],
                borderColor: tone.border,
                color: tone.text,
              }
            : {
                backgroundColor: tone.background,
                borderColor: tone.border,
                color: tone.text,
              };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto border shadow-md rounded-lg px-3 py-2 min-w-[220px] max-w-[360px]"
            style={baseStyle}
            onClick={() => removeToast(toast.id)}
          >
            <div className="text-sm font-semibold">{toast.title}</div>
            {toast.description && (
              <div className="text-xs opacity-80 mt-1">
                {toast.description}
              </div>
            )}
          </div>
        );
      })}
    </div>,
    document.body
  );
}
