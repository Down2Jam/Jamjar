import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export default function ScrollableTracks({ children, activeIndex }: { children: ReactNode; activeIndex: number }) {
  const uiText = useUiTranslations();
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const rows = Array.from(list.children) as HTMLElement[];
    const update = () => setHeight(rows.length > 3 ? rows.slice(0, 3).reduce((sum, row) => sum + row.getBoundingClientRect().height, 0) : undefined);
    const observer = new ResizeObserver(update);
    rows.forEach((row) => observer.observe(row));
    update();
    return () => observer.disconnect();
  }, [children]);
  useEffect(() => {
    const list = ref.current;
    const row = list?.children[activeIndex] as HTMLElement | undefined;
    if (!list || !row || !height) return;
    const listRect = list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const delta = rowRect.top < listRect.top ? rowRect.top - listRect.top
      : rowRect.bottom > listRect.bottom ? rowRect.bottom - listRect.bottom : 0;
    if (delta) list.scrollTo({ top: list.scrollTop + delta, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [activeIndex, height]);
  return <div ref={ref} role="region" aria-label={uiText("AppStrings.SoundtrackTracks")} tabIndex={height ? 0 : undefined} className="w-full overflow-y-auto overscroll-contain focus-visible:outline focus-visible:outline-2" style={{ maxHeight: height, scrollbarGutter: height ? "stable" : undefined }}>{children}</div>;
}
