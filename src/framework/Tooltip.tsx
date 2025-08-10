"use client";

import { useState, useRef } from "react";
import Popover from "@/framework/Popover";

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

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShown(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShown(false), hideDelay);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <Popover shown={shown} position={position} anchorToScreen={false}>
        <div className="px-3 py-1 text-sm whitespace-nowrap">{content}</div>
      </Popover>
    </div>
  );
}
