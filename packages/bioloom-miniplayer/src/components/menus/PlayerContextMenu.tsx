import { usePlayerUI, type PlayerTrackActions } from "../../context/PlayerUIContext";
import styles from "./PlayerContextMenu.module.css";
import PlayerMenuArrow from "./PlayerMenuArrow";
import { usePlayerMenu } from "../../hooks/usePlayerMenu";
import { menuClasses, menuThemeClasses } from "./menuStyles";
import { Music2, UserRound, Gamepad2, Download, ListStart, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { PlayableTrack } from "../../context/MusicContext";

export default function PlayerContextMenu({ track, x, y, anchor, accent, surfaceGradient, closePlayer, onClose, onPlayNext }: {
  track: PlayableTrack; x: number; y: number; anchor?: HTMLElement | null; accent: string; surfaceGradient: string;
  closePlayer?: () => void; onClose: (restoreFocus?: boolean) => void; onPlayNext?: () => void;
}) {
  const ui = usePlayerUI();
  const { Link } = ui;
  const [resolved, setResolved] = useState<{ track: PlayableTrack; actions: PlayerTrackActions } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (ui.loadTrackActions) void ui.loadTrackActions(track).then(actions => {
      if (!cancelled) setResolved({ track, actions });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [track, ui.loadTrackActions]);
  const actions = resolved?.track === track ? resolved.actions : ui.getTrackActions?.(track);
  const { menu, position, onKeyDown } = usePlayerMenu(x, y, anchor, onClose, resolved?.track === track ? resolved : track);
  return createPortal(<div className={menuThemeClasses} style={{ "--player-accent": accent, "--player-menu-gradient": surfaceGradient } as CSSProperties}>
    <PlayerMenuArrow position={position}/>
    <div ref={menu} className={`${menuClasses} ${styles.menu} `} role="menu" aria-label="Track actions" style={{ left: position.x, top: position.y }} onContextMenu={event => event.preventDefault()} onKeyDown={onKeyDown}>
      {onPlayNext && <button role="menuitem" onClick={() => { onClose(); onPlayNext(); }}><ListStart size={16}/><span>Play next</span></button>}
      {actions?.trackHref && <Link role="menuitem" onClick={() => onClose()} href={actions?.trackHref}><Music2 size={16} aria-hidden="true"/><span>View track</span></Link>}
      {actions?.artistHref && <Link role="menuitem" onClick={() => onClose()} href={actions.artistHref}><UserRound size={16} aria-hidden="true"/><span>View artist</span></Link>}
      {actions?.collectionHref && <Link role="menuitem" onClick={() => onClose()} href={actions.collectionHref}><Gamepad2 size={16} aria-hidden="true"/><span>View game</span></Link>}
      {actions?.download && <button className={`player-download-item ${styles.downloadItem}`} role="menuitem" onClick={() => {
        onClose();
        void actions.download!().catch(() => ui.onError?.("Could not download track."));
      }}><Download size={16} aria-hidden="true"/><span>Download track</span>{actions.downloadLabel && <span className={styles.menuLicense}>{actions.downloadLabel}</span>}</button>}
      {closePlayer && <><div role="separator"/>
      <button role="menuitem" onClick={() => { onClose(); closePlayer(); }}><X size={16} aria-hidden="true"/><span>Close player</span></button></>}
    </div>
  </div>, document.body);
}
