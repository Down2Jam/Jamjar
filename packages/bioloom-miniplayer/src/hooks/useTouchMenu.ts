import { useEffect, useRef, type PointerEvent, type MouseEvent } from "react";

export function useTouchMenu(open: (kind: string, target: HTMLElement) => void) {
  const pending = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const suppressUntil = useRef(0);
  const pressedTarget = useRef<HTMLElement | null>(null);
  const cancel = () => { if (pending.current) clearTimeout(pending.current.timer); pending.current = null; };
  useEffect(() => cancel, []);
  return {
    onPointerDownCapture: (event: PointerEvent<HTMLElement>) => {
      cancel();
      if (event.pointerType === "mouse") return;
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-touch-menu]");
      if (!target) return;
      pressedTarget.current = target;
      pending.current = { x: event.clientX, y: event.clientY, timer: setTimeout(() => {
        pending.current = null;
        suppressUntil.current = Date.now() + 1500;
        open(target.dataset.touchMenu!, target);
      }, 500) };
    },
    onPointerMoveCapture: (event: PointerEvent<HTMLElement>) => {
      if (pending.current && Math.hypot(event.clientX - pending.current.x, event.clientY - pending.current.y) > 10) cancel();
    },
    onPointerUpCapture: (event: PointerEvent<HTMLElement>) => { cancel(); if (Date.now() < suppressUntil.current) event.preventDefault(); },
    onPointerCancelCapture: cancel,
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (Date.now() < suppressUntil.current && pressedTarget.current?.contains(event.target as Node)) { event.preventDefault(); event.stopPropagation(); suppressUntil.current = 0; }
    },
  };
}
