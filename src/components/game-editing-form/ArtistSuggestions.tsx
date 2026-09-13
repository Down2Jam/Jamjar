import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Popover } from "bioloom-ui";

export default function ArtistSuggestions({ children, onClose }: {
  children: ReactNode;
  onClose: () => void;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current?.parentElement;
    if (!anchor) return;
    const update = () => setRect(anchor.getBoundingClientRect());
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const outside = (event: MouseEvent) => {
      if (!anchor.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", outside);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("mousedown", outside);
    };
  }, [onClose]);

  return <>
    <span ref={anchorRef} className="hidden" />
    {rect && <Popover shown anchorToScreen position="bottom" showArrow={false} padding={8}
      positionerStyle={{ position: "fixed", left: rect.left, top: rect.bottom + 8, zIndex: 120 }}>
      <div ref={menuRef} className="max-h-60 overflow-y-auto" style={{ width: rect.width, maxWidth: "calc(100vw - 32px)" }}>
        {children}
      </div>
    </Popover>}
  </>;
}
