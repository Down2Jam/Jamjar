import styles from "./PlayerTrackMenu.module.css";
import PlayerMenuArrow from "./PlayerMenuArrow";
import { usePlayerMenu } from "../../hooks/usePlayerMenu";
import { menuClasses, menuThemeClasses } from "./menuStyles";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { GripVertical, History, ListMusic, ListStart, X } from "lucide-react";
import { usePlayerUI } from "../../context/PlayerUIContext";
import RecordDisc from "../RecordDisc";
import type { TrackType } from "../../context/MusicContext";


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
  const { Link, historyHref, fallbackArtwork } = usePlayerUI();
  const drag = useRef<{ from: number; to: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (kind !== "history") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [kind]);
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
  const { menu, position, onKeyDown } = usePlayerMenu(x, y, anchor, onClose, tracks.length);
  return createPortal(<div className={menuThemeClasses} style={{ "--player-accent": accent, "--player-menu-gradient": surfaceGradient } as CSSProperties}>
    <PlayerMenuArrow position={position}/>
    <div ref={menu} className={`${menuClasses} player-track-menu ${styles.trackMenu} `} style={{ left: position.x, top: position.y }} role="menu" aria-label={kind === "queue" ? "Music queue" : "Playback history"} onContextMenu={event => event.preventDefault()} onKeyDown={onKeyDown}>
      <div className={`player-track-menu-heading ${styles.trackMenuHeading}`}>{kind === "queue" ? <ListMusic size={16} aria-hidden="true"/> : <History size={16} aria-hidden="true"/>}<strong>{kind === "queue" ? "Queue" : "History"}</strong><button role="menuitem" aria-label="Close menu" onClick={() => onClose(true)}><X size={16}/></button></div>
      {kind === "history" && historyHref && <Link role="menuitem" className="player-history-link" href={historyHref}>View listening history</Link>}
      <div className={`player-track-menu-items ${styles.trackMenuItems}`}>
        {tracks.length ? tracks.map((track, index) => <div className={`player-queue-row ${styles.queueRow}`} data-queue-index={index} data-drop-target={dropIndex === index} key={kind === "queue" ? `${track.id ?? track.url}:${track.pageVersion}` : index}>
          {kind === "queue" && <button className="player-queue-action player-queue-grip" role="menuitem" aria-label={`Move ${track.name}. Use up and down arrows to reorder.`}
            onKeyDown={event => { if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); event.stopPropagation(); onMove(index, index + (event.key === "ArrowUp" ? -1 : 1)); } }}
            {...dragHandlers(index)}><GripVertical size={13}/></button>}
          <button className={`player-queue-play ${styles.queuePlay}`} data-draggable={kind === "queue"} {...dragHandlers(index)} role="menuitem" onClick={event => { if (suppressClick.current) { suppressClick.current = false; event.preventDefault(); return; } onPlay(track); }}><RecordDisc showPlayOverlay className={`player-menu-disc ${styles.menuDisc}`} artwork={track.game.soundtrackThumbnail || track.game.thumbnail || fallbackArtwork || ""}/><span className="player-menu-track-text"><strong>{track.name}</strong><small className={`player-menu-track-meta ${styles.menuTrackMeta}`}><span>{track.composer.name || track.composer.slug || ""}</span>{kind === "history" && track.playedAt && <span className="player-menu-track-time">{elapsedLabel((now - track.playedAt) / 1000)}</span>}</small></span></button>
          {kind === "queue" ? <button className="player-queue-action" role="menuitem" aria-label={`Remove ${track.name} from queue`} title="Remove from queue" onClick={() => onRemove(index)}><X size={14}/></button> : <button className="player-queue-action" role="menuitem" aria-label={`Play ${track.name} next`} title="Play next" onClick={() => onEnqueue(track)}><ListStart size={15}/></button>}
        </div>) : <p>{kind === "history" ? "No playback history yet" : "Queue is empty"}</p>}
      </div>
    </div>
  </div>, document.body);
}
