import { useEffect, useRef, type ReactNode } from "react";
import { Popover } from "bioloom-ui";
import { createPortal } from "react-dom";

export default function MobileComposerDialog({ open, onClose, children }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => panel.current?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) closeRef.current();
      if (event.key !== "Tab" || !panel.current?.contains(document.activeElement)) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), [contenteditable="true"], [tabindex="0"]',
      )).filter((item) => item.getClientRects().length > 0);
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [open]);
  return <>
    {open && createPortal(<div className="fixed inset-0 bg-black/80" style={{ zIndex: 79 }} onClick={onClose} aria-hidden="true" />, document.body)}
    <Popover shown={open} anchorToScreen position="center" onClose={onClose}
    showArrow={false} surface="contrast" padding={16} disableHoverScale>
    <div ref={panel} tabIndex={-1} className="w-[440px] max-w-[calc(100vw-64px)] max-h-[calc(100dvh-96px)] overflow-y-auto outline-none">
      {children}
    </div>
  </Popover></>;
}
