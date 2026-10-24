import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Link from "@/compat/next-link";

export default function ScrollingTrackTitle({ name, href }: { name: string; href?: string }) {
  const viewport = useRef<HTMLElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (!viewport.current || !content.current) return;
      setOverflow(Math.max(0, Math.ceil(content.current.getBoundingClientRect().width - viewport.current.clientWidth)));
    };
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (content.current) observer.observe(content.current);
    measure();
    return () => observer.disconnect();
  }, [name]);

  return <strong ref={viewport} className={"player-title [&.is-overflowing_.player-title-content]:animate-[player-title-scroll_var(--title-scroll-duration)_ease-in-out_infinite] [@media(prefers-reduced-motion:reduce)]:[&.is-overflowing_.player-title-content]:animate-none " + (overflow > 1 ? " is-overflowing" : "")} style={{ "--title-scroll-distance": -overflow + "px", "--title-scroll-duration": Math.max(8, overflow / 24 * 2 + 4) + "s" } as CSSProperties}>
    <span key={name} ref={content} className={"player-title-content inline-block w-max max-w-none whitespace-nowrap [@media(prefers-reduced-motion:reduce)]:inline "}>{href ? <Link href={href}>{name}</Link> : name}</span>
  </strong>;
}
