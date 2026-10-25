import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { positionPlayerMenu } from "../lib/menuPosition";

const menuItems = '[role^="menuitem"]:not(:disabled)';

export function usePlayerMenu(x: number, y: number, anchor: HTMLElement | null | undefined, onClose: (restoreFocus?: boolean) => void, layoutKey: unknown) {
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y, arrowX: x, arrowY: y, opensAbove: true, width: 0 });

  useLayoutEffect(() => {
    if (menu.current) setPosition(positionPlayerMenu(menu.current, x, y, anchor));
  }, [x, y, anchor, layoutKey]);

  useEffect(() => {
    menu.current?.querySelector<HTMLElement>(menuItems)?.focus();
    const outside = (event: Event) => {
      if (!(event.target instanceof Node) || !menu.current?.contains(event.target)) onClose();
    };
    const resize = () => onClose();

    window.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", outside, true);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("pointerdown", outside);
      window.removeEventListener("scroll", outside, true);
      window.removeEventListener("resize", resize);
    };
  }, [onClose]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      onClose(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>(menuItems) ?? []);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };

  return { menu, position, onKeyDown };
}
