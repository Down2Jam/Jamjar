import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Dropdown, type IconName } from "bioloom-ui";

type Choice = { id: string; name: string; description?: string; icon?: IconName; inline?: boolean };
type Group = { label: string; selected: string; choices: Choice[]; onSelect: (id: string) => void; maxInline?: number };

export default function MusicTabs({ groups, ariaLabel = "Music lists" }: { groups: Group[]; ariaLabel?: string }) {
  const root = useRef<HTMLElement>(null);
  const measurements = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<string[][]>([]);

  useLayoutEffect(() => {
    const element = root.current;
    const measure = measurements.current;
    if (!element || !measure) return;

    const update = () => {
      const mobile = window.matchMedia("(max-width: 700px)").matches;
      const next = groups.map(group => {
        const candidates = group.choices.filter(choice => choice.id === group.selected || (!mobile && choice.inline));
        const limit = group.maxInline ?? candidates.length;
        const otherIds = candidates.filter(choice => choice.id !== group.selected).slice(0, Math.max(0, limit - 1)).map(choice => choice.id);
        return candidates.filter(choice => choice.id === group.selected || otherIds.includes(choice.id)).map(choice => choice.id);
      });
      const widthOf = (group: number, id: string) => {
        const index = groups[group].choices.findIndex(choice => choice.id === id);
        return (measure.children[group]?.children[index] as HTMLElement)?.getBoundingClientRect().width ?? 0;
      };
      // Reserve a touch-sized chevron and the same gaps used by the visible row.
      const totalWidth = () => 24 + next.reduce((sum, ids, group) => sum + 44 + ids.reduce((width, id) => width + widthOf(group, id) + 16, 0), 0);

      while (totalWidth() > element.clientWidth) {
        const candidates = next.flatMap((ids, group) => ids.filter(id => id !== groups[group].selected).map(id => ({ group, id })));
        const candidate = candidates.at(-1);
        if (!candidate) break;
        next[candidate.group] = next[candidate.group].filter(id => id !== candidate.id);
      }
      setVisible(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    observer.observe(measure);
    window.addEventListener("resize", update);
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, [groups]);

  return <nav ref={root} className="music-responsive-tabs relative flex justify-between gap-6 mb-1.5 border-b border-[color-mix(in_srgb,var(--music-text)_9%,transparent)] text-[15px] font-semibold max-[700px]:gap-3" aria-label={ariaLabel}>
    <div ref={measurements} className="music-tab-measurements absolute invisible pointer-events-none h-0 overflow-hidden w-max [&>div]:flex [&_span]:whitespace-nowrap [&_span]:flex-none" aria-hidden="true" inert>
      {groups.map(group => <div key={group.label}>{group.choices.map(choice => <span key={choice.id}>{choice.name}</span>)}</div>)}
    </div>
    {groups.map((group, index) => {
      const ids = visible[index] ?? [group.selected];
      const overflow = group.choices.filter(choice => !ids.includes(choice.id));
      const menu = <Dropdown instant portal position={index === 0 ? "bottom-left" : "bottom-right"} selectedValue={group.selected} onSelect={id => group.onSelect(String(id))}
          trigger={<button type="button" className="music-responsive-chevron min-h-11 border-0 bg-transparent text-[var(--music-muted)] cursor-pointer hover:text-[var(--music-accent)] focus-visible:outline-2 focus-visible:outline-[var(--music-accent)] focus-visible:-outline-offset-2 grid place-items-center w-11 disabled:invisible" aria-label={group.label} aria-haspopup="menu" disabled={!overflow.length}><ChevronDown size={18} aria-hidden="true" /></button>}>
          {overflow.map(choice => <Dropdown.Item key={choice.id} value={choice.id} icon={choice.icon} description={choice.description}>{choice.name}</Dropdown.Item>)}
        </Dropdown>;
      return <div key={group.label} className="music-responsive-tab-group flex items-center gap-4 min-w-0 max-[700px]:gap-0.5 max-[700px]:max-w-[calc(50%_-_6px)]">
        {index === 1 && menu}
        {group.choices.filter(choice => ids.includes(choice.id)).map(choice => <button key={choice.id} type="button" className="music-responsive-tab min-h-11 border-0 bg-transparent text-[var(--music-muted)] cursor-pointer hover:text-[var(--music-accent)] focus-visible:outline-2 focus-visible:outline-[var(--music-accent)] focus-visible:-outline-offset-2 min-w-0 py-3 px-0 overflow-hidden text-ellipsis whitespace-nowrap border-b-2 border-b-transparent aria-[current=page]:text-[var(--music-accent)] aria-[current=page]:border-b-[var(--music-accent)]" aria-current={group.selected === choice.id ? "page" : undefined} title={choice.description ?? choice.name} onClick={() => group.onSelect(choice.id)}>{choice.name}</button>)}
        {index === 0 && menu}
      </div>;
    })}
  </nav>;
}
