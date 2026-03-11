"use client";

import { useCallback, useState, useRef } from "react";
import Popover from "./Popover";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
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
  delay?: number;
  hideDelay?: number;
}

export default function Tooltip({
  content,
  children,
  position = "bottom",
  delay = 100,
  hideDelay = 100,
}: TooltipProps) {
  const [shown, setShown] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [positionerStyle, setPositionerStyle] = useState<React.CSSProperties>();

  const updatePosition = useCallback(() => {
    const node = triggerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const gap = 8;

    const nextStyle: React.CSSProperties = {
      position: "fixed",
      zIndex: 80,
      pointerEvents: "none",
    };

    switch (position) {
      case "top-left":
        nextStyle.left = rect.left;
        nextStyle.top = rect.top - gap;
        nextStyle.transform = "translateY(-100%)";
        break;
      case "top-right":
        nextStyle.left = rect.right;
        nextStyle.top = rect.top - gap;
        nextStyle.transform = "translate(-100%, -100%)";
        break;
      case "bottom-left":
        nextStyle.left = rect.left;
        nextStyle.top = rect.bottom + gap;
        break;
      case "bottom-right":
        nextStyle.left = rect.right;
        nextStyle.top = rect.bottom + gap;
        nextStyle.transform = "translateX(-100%)";
        break;
      case "left":
        nextStyle.left = rect.left - gap;
        nextStyle.top = rect.top + rect.height / 2;
        nextStyle.transform = "translate(-100%, -50%)";
        break;
      case "right":
        nextStyle.left = rect.right + gap;
        nextStyle.top = rect.top + rect.height / 2;
        nextStyle.transform = "translateY(-50%)";
        break;
      case "bottom":
        nextStyle.left = rect.left + rect.width / 2;
        nextStyle.top = rect.bottom + gap;
        nextStyle.transform = "translateX(-50%)";
        break;
      case "center":
        nextStyle.left = rect.left + rect.width / 2;
        nextStyle.top = rect.top + rect.height / 2;
        nextStyle.transform = "translate(-50%, -50%)";
        break;
      case "top":
      default:
        nextStyle.left = rect.left + rect.width / 2;
        nextStyle.top = rect.top - gap;
        nextStyle.transform = "translate(-50%, -100%)";
        break;
    }

    setPositionerStyle(nextStyle);
  }, [position]);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    timeoutRef.current = setTimeout(() => setShown(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShown(false), hideDelay);
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <Popover
        shown={shown}
        position={position}
        anchorToScreen
        positionerStyle={positionerStyle}
      >
        <div className="px-3 py-1 text-sm whitespace-nowrap">{content}</div>
      </Popover>
    </div>
  );
}
