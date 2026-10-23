import PlayerMenuArrow from "./PlayerMenuArrow";
import { positionPlayerMenu } from "./menuPosition";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { GripVertical, History, ListMusic, ListStart, X } from "lucide-react";
import Link from "@/compat/next-link";
import RecordDisc from "./RecordDisc";
import type { TrackType } from "./MusicContext";


function elapsedLabel(seconds: number) {
  const units = [[86400, "day"], [3600, "hour"], [60, "minute"], [1, "second"]] as const;
  const [size, unit] = units.find(([size]) => seconds >= size) ?? units[3];
  const count = Math.max(0, Math.floor(seconds / size));
  return count + " " + unit + (count === 1 ? "" : "s") + " ago";
}


export default function PlayerTrackMenu({ kind, tracks, x, y, anchor, accent, surfaceGradient, onPlay, onClose, onMove, onRemove, onEnqueue }: {
  kind: "queue" | "history"; tracks: TrackType[]; x: number; y: number; anchor?: HTMLElement | null; accent: string; surfaceGradient: string;
  onPlay: (track: TrackType) => void; onClose: (restoreFocus?: boolean) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onEnqueue: (track: TrackType) => void;
}) {
  const drag = useRef<{ from: number; to: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (kind !== "history") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [kind]);
  const menu = useRef<HTMLDivElement>(null);
  const dragHandlers = (index: number) => kind === "queue" ? {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      suppressClick.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { from: index, to: index, x: event.clientX, y: event.clientY, moved: false };
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const active = drag.current;
      if (!active) return;
      if (!active.moved && Math.hypot(event.clientX - active.x, event.clientY - active.y) < 6) return;
      active.moved = true;
      suppressClick.current = true;
      const list = menu.current?.querySelector<HTMLElement>(".player-track-menu-items");
      if (list) {
        const bounds = list.getBoundingClientRect();
        if (event.clientY < bounds.top + 24) list.scrollTop -= 12;
        else if (event.clientY > bounds.bottom - 24) list.scrollTop += 12;
      }
      const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-queue-index]");
      if (row && menu.current?.contains(row)) active.to = Number(row.dataset.queueIndex);
      setDropIndex(active.to);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const active = drag.current;
      drag.current = null;
      setDropIndex(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (active?.moved) onMove(active.from, active.to);
    },
    onPointerCancel: () => { drag.current = null; setDropIndex(null); },
    onDragStart: (event: React.DragEvent<HTMLButtonElement>) => event.preventDefault(),
  } : {};
  const [position, setPosition] = useState({ x, y, arrowX: x, arrowY: y, opensAbove: true, width: 0 });
  useLayoutEffect(() => {
    if (menu.current) setPosition(positionPlayerMenu(menu.current, x, y, anchor));
  }, [x, y, anchor, tracks.length]);
  useEffect(() => {
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) onClose(); };
    const scroll = (event: Event) => { if (event.target instanceof Node && menu.current?.contains(event.target)) return; onClose(); };
    const resize = () => onClose();
    window.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("pointerdown", outside); window.removeEventListener("scroll", scroll, true); window.removeEventListener("resize", resize); };
  }, [onClose]);
  return createPortal(<div className={"jamjar-yard-player [--player-disc-diameter:116px] [--player-disc-left:-16px] [--player-disc-bottom:-22px] [--compact-disc-left:-14px] [--compact-disc-diameter:82px] [--compact-disc-gap:9px] [--player-accent:#80cfae] [--site-bg:#101b27] [--site-surface:#1a2936] [--site-surface-hover:#263947] [--site-line:#354c59] [--site-accent:#19ff90] [--site-font:Inter,system-ui,sans-serif] text-[#f4f5f2] max-[700px]:[--player-disc-diameter:110px] max-[700px]:[--player-disc-left:-14px] max-[700px]:[--player-disc-bottom:-7px] [&_.record-disc-hole]:[fill:#101b27] [&_.player-color-layer]:[background:linear-gradient(90deg,color-mix(in_srgb,var(--player-accent)_24%,transparent)_0%,color-mix(in_srgb,var(--player-accent)_9%,transparent)_48%,transparent_100%)] [&_.player-bar.is-compact_.player-transport]:gap-0 [&_.player-bar.is-compact_.player-transport_.player-skip]:w-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:h-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:min-w-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:min-h-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:[flex:0_0_28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:p-[3px] [&_.player-bar.is-compact_.player-primary]:w-[28px] [&_.player-bar.is-compact_.player-primary]:h-[28px] [&_.player-bar.is-compact_.player-primary]:min-w-[28px] [&_.player-bar.is-compact_.player-primary]:min-h-[28px] [&_.player-bar.is-compact_.player-primary]:[flex:0_0_28px] [&_.player-bar.is-compact_.player-primary]:p-[3px] [&_.player-identity_a]:text-[inherit] [&_.player-identity_a]:no-underline [&_.player-identity_a:hover]:underline [&_.player-queue]:[--site-surface:#1a2936] [&_.player-queue]:[--site-surface-hover:#263947] [&_.player-queue]:[--site-line:#354c59] [&_.player-queue]:[--site-font:Inter,system-ui,sans-serif] max-[700px]:[&_.player-extras]:gap-[2px] max-[700px]:[&_.player-extras_button]:min-w-[25px] max-[700px]:[&_.player-identity_strong]:text-[13px] [&_.player-rating]:flex [&_.player-rating]:items-center [&_.player-rating]:gap-[1px] [&_.player-rating]:text-[var(--player-accent)] [&_.player-rating_.player-rating-half]:absolute [&_.player-rating_.player-rating-half]:top-0 [&_.player-rating_.player-rating-half]:w-[50%] [&_.player-rating_.player-rating-half]:min-w-0 [&_.player-rating_.player-rating-half]:h-full [&_.player-rating_.player-rating-half]:p-0 [&_.player-rating_.player-rating-half]:text-[inherit] [&_.player-rating_.player-rating-half:focus-visible]:outline-offset-0 [&_[data-touch-menu]]:[-webkit-touch-callout:none] [&_[data-touch-menu]]:select-none "} style={{ "--player-accent": accent, "--player-menu-gradient": surfaceGradient } as CSSProperties}>
    <PlayerMenuArrow position={position}/>
    <div ref={menu} className={"player-context-menu overscroll-contain fixed z-[1000] w-[190px] max-w-[calc(100vw_-_16px)] max-h-[calc(100dvh_-_16px)] overflow-y-auto p-[5px] [border:0] rounded-[10px] [background:var(--player-menu-gradient),var(--site-surface)] text-[#f4f5f2] [box-shadow:0_5px_20px_#0006] [font:600_13px_var(--site-font)] [&_:where([role^='menuitem'])]:flex [&_:where([role^='menuitem'])]:items-center [&_:where([role^='menuitem'])]:gap-[9px] [&_:where([role^='menuitem'])]:w-full [&_:where([role^='menuitem'])]:box-border [&_:where([role^='menuitem'])]:[border:0] [&_:where([role^='menuitem'])]:rounded-[4px] [&_:where([role^='menuitem'])]:p-[8px_10px] [&_:where([role^='menuitem'])]:bg-transparent [&_:where([role^='menuitem'])]:text-[inherit] [&_:where([role^='menuitem'])]:[font:inherit] [&_:where([role^='menuitem'])]:text-left [&_:where([role^='menuitem'])]:no-underline [&_:where([role^='menuitem'])]:cursor-[pointer] [&_[role^='menuitem']:hover:not(:disabled)]:[background:var(--player-accent)] [&_[role^='menuitem']:hover:not(:disabled)]:text-[#101b27] [&_[role^='menuitem']:hover:not(:disabled)]:[outline:none] [&_[role^='menuitem']:focus-visible]:[background:var(--player-accent)] [&_[role^='menuitem']:focus-visible]:text-[#101b27] [&_[role^='menuitem']:focus-visible]:[outline:none] [&_[role^='menuitem']:disabled]:opacity-[.4] [&_[role^='menuitem']:disabled]:cursor-[default] [&_[role='separator']]:h-[1px] [&_[role='separator']]:[background:#ffffff18] [&_[role='separator']]:m-[4px_5px] [&_[role^='menuitem']_svg]:flex-none [&_.player-queue-action]:w-[24px] [&_.player-queue-action]:min-h-[40px] [&_.player-queue-action]:[flex:0_0_24px] [&_.player-queue-action]:justify-center [&_.player-queue-action]:p-[4px] [&_.player-queue-grip]:w-[18px] [&_.player-queue-grip]:basis-[18px] [&_.player-queue-grip]:cursor-[grab] [&_.player-queue-grip]:touch-none [&_.player-queue-play]:flex-1 [&_.player-queue-play]:min-w-0 [&_.player-queue-play]:pl-[4px] [&_.player-queue-play]:pr-[4px] [&_.player-download-item]:grid [&_.player-download-item]:grid-cols-[16px_minmax(0,1fr)] [&_.player-download-item]:items-start [&_.player-download-item]:gap-x-[9px] [&_.player-download-item]:gap-y-[4px]  player-track-menu w-[280px] [&_.player-track-menu-heading_button]:w-auto [&_.player-track-menu-heading_button]:p-[5px] "} style={{ left: position.x, top: position.y }} role="menu" aria-label={kind === "queue" ? "Music queue" : "Playback history"} onContextMenu={event => event.preventDefault()} onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); onClose(true); return; }
      if (event.key === "Tab") { onClose(true); return; }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }}>
      <div className={"player-track-menu-heading flex items-center gap-[8px] p-[4px_5px_7px] mb-[4px] [border-bottom:1px_solid_#ffffff18] [&_strong]:flex-1 [&_strong]:font-semibold [&_strong]:leading-[18px] "}>{kind === "queue" ? <ListMusic size={16} aria-hidden="true"/> : <History size={16} aria-hidden="true"/>}<strong>{kind === "queue" ? "Queue" : "History"}</strong><button role="menuitem" aria-label="Close menu" onClick={() => onClose(true)}><X size={16}/></button></div>
      {kind === "history" && <Link role="menuitem" className="player-history-link" href="/music/history">View listening history</Link>}
      <div className={"player-track-menu-items overscroll-contain max-h-[min(320px,60dvh)] overflow-y-auto [&_.player-menu-track-text]:min-w-0 [&_.player-menu-track-text]:flex-1 [&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[13px] [&_strong]:font-semibold [&_strong]:leading-[18px] [&_small]:block [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[12px] [&_small]:font-normal [&_small]:leading-[16px] [&_small]:mt-[2px] [&_p]:p-[10px] [&_p]:m-0 [&_p]:font-normal [&_.player-menu-disc]:w-[40px] [&_.player-menu-disc]:h-[40px] [&_.player-menu-disc]:[flex:0_0_40px] [&_.player-menu-disc]:[box-shadow:0_2px_4px_#0004] [&_button:is(:hover,:focus-visible)_.record-disc-action]:opacity-[1] [&_button:is(:hover,:focus-visible)_.record-disc-label]:[filter:brightness(.72)] [&_button:is(:hover,:focus-visible)_.record-disc-details]:opacity-0 [&_.player-menu-track-meta]:flex [&_.player-menu-track-meta]:items-baseline [&_.player-menu-track-meta]:gap-[7px] "}>
        {tracks.length ? tracks.map((track, index) => <div className={"player-queue-row flex items-center rounded-[4px] [&[data-drop-target=true]]:[outline:1px_solid_var(--player-accent)] [&[data-drop-target=true]]:outline-offset-[-1px] "} data-queue-index={index} data-drop-target={dropIndex === index} key={kind === "queue" ? `${track.id ?? track.url}:${track.pageVersion}` : index}>
          {kind === "queue" && <button className="player-queue-action player-queue-grip" role="menuitem" aria-label={`Move ${track.name}. Use up and down arrows to reorder.`}
            onKeyDown={event => { if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); event.stopPropagation(); onMove(index, index + (event.key === "ArrowUp" ? -1 : 1)); } }}
            {...dragHandlers(index)}><GripVertical size={13}/></button>}
          <button className={"player-queue-play [&[data-draggable=true]]:touch-none [&[data-draggable=true]]:select-none "} data-draggable={kind === "queue"} {...dragHandlers(index)} role="menuitem" onClick={event => { if (suppressClick.current) { suppressClick.current = false; event.preventDefault(); return; } onPlay(track); }}><RecordDisc showPlayOverlay className={"player-menu-disc [&_.record-disc-action]:transition-none [&_.record-disc-label]:transition-none [&_.record-disc-details]:transition-none "} artwork={track.game.soundtrackThumbnail || track.game.thumbnail || "/images/game-thumbnail.png"}/><span className="player-menu-track-text"><strong>{track.name}</strong><small className={"player-menu-track-meta [&>span:first-child]:min-w-0 [&>span:first-child]:overflow-hidden [&>span:first-child]:text-ellipsis [&_.player-menu-track-time]:shrink-0 [&_.player-menu-track-time]:text-[#ffffff80] [&_.player-menu-track-time]:text-[11px] [&_.player-menu-track-time]:tabular-nums "}><span>{track.composer.name || track.composer.slug || ""}</span>{kind === "history" && track.playedAt && <span className="player-menu-track-time">{elapsedLabel((now - track.playedAt) / 1000)}</span>}</small></span></button>
          {kind === "queue" ? <button className="player-queue-action" role="menuitem" aria-label={`Remove ${track.name} from queue`} title="Remove from queue" onClick={() => onRemove(index)}><X size={14}/></button> : <button className="player-queue-action" role="menuitem" aria-label={`Play ${track.name} next`} title="Play next" onClick={() => onEnqueue(track)}><ListStart size={15}/></button>}
        </div>) : <p>{kind === "history" ? "No playback history yet" : "Queue is empty"}</p>}
      </div>
    </div>
  </div>, document.body);
}
