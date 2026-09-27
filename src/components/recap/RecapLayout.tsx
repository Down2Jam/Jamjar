import { useEffect, useRef, useState, type ReactNode } from "react";
import { Award, Gamepad2, Headphones, Heart, LayoutList, MessageSquare, Share2, Star, Trophy, ArrowRight } from "lucide-react";
import { useTheme } from "@/providers/useSiteTheme";

const icons = {
  overview: LayoutList, games: Gamepad2, "game-ratings": Star,
  "game-words": MessageSquare, "favorite-games": Heart, "game-recommendations": Heart,
  "top-games": Trophy, music: Headphones, "music-ratings": Star,
  "music-words": MessageSquare, "favorite-music": Heart, "music-recommendations": Heart,
  "top-music": Trophy, achievements: Award, "earned-achievements": Award,
  share: Share2, next: ArrowRight,
};

type Section = { id: string; label: string; group: boolean };

export default function RecapLayout({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const content = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const elements = [...(content.current?.querySelectorAll<HTMLElement>("[data-recap-section]") ?? [])]
      .filter((element) => element.getClientRects().length > 0);
    setSections(elements.map((element) => ({
      id: element.id,
      label: element.dataset.recapSection ?? "",
      group: element.dataset.recapGroup === "true",
    })));
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = elements.filter((element) => element.getBoundingClientRect().top <= 160).at(-1);
        setActive(current?.id ?? elements[0]?.id ?? "overview");
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [children]);

  const activeGroup = sections
    .slice(0, sections.findIndex((section) => section.id === active) + 1)
    .filter((section) => section.group)
    .at(-1)?.id;

  return (
    <div className="mx-auto max-w-[100rem] px-14 py-8 sm:px-16 lg:px-24 lg:py-14" style={{ color: colors.text }}>
      <nav aria-label="Recap sections" className="fixed left-1 top-1/2 z-20 flex max-h-[calc(100dvh-10rem)] -translate-y-1/2 flex-col gap-1 overflow-y-auto rounded-xl p-1 sm:left-3 lg:left-5" style={{ backgroundColor: colors.mantle }}>
        {sections.filter((section) => section.group).map(({ id, label, group }) => {
          const Icon = icons[id as keyof typeof icons] ?? LayoutList;
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-label={label}
              title={label}
              aria-current={activeGroup === id ? "location" : undefined}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:-outline-offset-2 ${group ? "mt-3 first:mt-0" : ""}`}
              style={{ color: activeGroup === id ? colors.text : colors.textFaded, backgroundColor: activeGroup === id ? `color-mix(in srgb, ${colors.text} 10%, ${colors.mantle})` : undefined }}
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(id);
                target?.focus({ preventScroll: true });
                target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
                setActive(id);
              }}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
            </a>
          );
        })}
      </nav>
      <div ref={content} className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-20 pb-16 md:gap-28 lg:px-6 xl:px-10 [&_[data-recap-section]]:scroll-mt-28 [&_[data-recap-section]]:outline-none">
        {children}
      </div>
    </div>
  );
}
