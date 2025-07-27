import { useRef, useState } from "react";
import Popover from "@/components/popover";

interface DropdownProps {
  trigger: React.ReactNode;
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
  className?: string;
  openOn?: "hover" | "click" | "both";
  hoverDelay?: number;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean; // controlled
  defaultOpen?: boolean; // uncontrolled
}

export default function Dropdown({
  trigger,
  children,
  position = "bottom-left",
  className,
  openOn = "click",
  hoverDelay = 150,
  onOpenChange,
  isOpen,
  defaultOpen = false,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = isOpen ?? internalOpen;

  const supportsClick = openOn === "click" || openOn === "both";
  const supportsHover = openOn === "hover" || openOn === "both";

  const setOpenAndNotify = (value: boolean) => {
    if (isOpen === undefined) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  const handleMouseEnter = () => {
    if (!supportsHover) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setOpenAndNotify(true);
  };

  const handleMouseLeave = () => {
    if (!supportsHover) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenAndNotify(false);
    }, hoverDelay);
  };

  const handleClick = () => {
    if (!supportsClick) return;
    setOpenAndNotify(!open);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div onClick={handleClick} className="cursor-pointer">
        {trigger}
      </div>

      <Popover
        shown={open}
        position={position}
        anchorToScreen={false}
        className={className}
      >
        {children}
      </Popover>
    </div>
  );
}
