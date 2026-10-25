import styles from "./ScrollingTrackTitle.module.css";
import { useLayoutEffect, useRef } from "react";
import { usePlayerUI } from "../context/PlayerUIContext";

export default function ScrollingTrackTitle({ name, href }: { name: string; href?: string }) {
  const { Link } = usePlayerUI();
  const viewport = useRef<HTMLElement>(null);
  const content = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | undefined;
    const measure = () => {
      animation?.cancel();
      if (!viewport.current || !content.current) return;
      const overflow = Math.ceil(content.current.scrollWidth - viewport.current.clientWidth);
      if (overflow <= 1 || motion.matches) return;
      animation = content.current.animate([
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(0)", offset: .15 },
        { transform: `translateX(${-overflow}px)`, offset: .5 },
        { transform: `translateX(${-overflow}px)`, offset: .65 },
        { transform: "translateX(0)", offset: 1 },
      ], { duration: Math.max(8, overflow / 12 + 4) * 1000, iterations: Infinity, easing: "ease-in-out" });
    };
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (content.current) observer.observe(content.current);
    measure();
    motion.addEventListener("change", measure);
    return () => {
      animation?.cancel();
      observer.disconnect();
      motion.removeEventListener("change", measure);
    };
  }, [name]);

  return <strong ref={viewport} className="player-title">
    <span key={name} ref={content} className={`player-title-content ${styles.titleContent}`}>{href ? <Link href={href}>{name}</Link> : name}</span>
  </strong>;
}
