import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button, Popover, type IconName } from "bioloom-ui";

export default function GameInfoButton({ label, icon, children }: {
  label: string;
  icon: IconName;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const update = () => setRect(anchor.current?.getBoundingClientRect() ?? null);
    const outside = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node) && !content.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        anchor.current?.querySelector("button")?.focus();
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <div ref={anchor}>
    <Button size="sm" variant="ghost" icon={icon} className="!h-6 !w-6 !min-w-0 !p-0 !border-0 !bg-transparent !shadow-none opacity-60 hover:opacity-100 focus-visible:opacity-100 transition-opacity" title={label} aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)} />
    {rect && <Popover shown={open} anchorToScreen position="bottom" showArrow={false} padding={16} disableHoverScale
      positionerStyle={{ position: "fixed", left: rect.left, top: rect.bottom + 8, zIndex: 80 }}>
      <div ref={content} id={id} role="region" aria-label={label} className="w-64 max-w-[calc(100vw-64px)]">
        <p className="mb-3 text-sm font-semibold">{label}</p>
        {children}
      </div>
    </Popover>}
  </div>;
}
