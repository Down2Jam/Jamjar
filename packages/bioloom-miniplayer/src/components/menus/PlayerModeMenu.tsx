import styles from "./PlayerModeMenu.module.css";
import PlayerMenuArrow from "./PlayerMenuArrow";
import { usePlayerMenu } from "../../hooks/usePlayerMenu";
import { menuClasses, menuThemeClasses } from "./menuStyles";
import { type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AudioLines, Blend, Check, Infinity as InfinityIcon, ListOrdered, Repeat1, Shuffle, CircleStop, CircleOff } from "lucide-react";
import type { MusicContextValue } from "../../context/MusicContext";

export default function PlayerModeMenu({ section = "all", mode, x, y, anchor, accent, surfaceGradient, onSelect, onShuffle, shuffle, transitionMode, onTransition, onClose }: {
  section?: "all" | "shuffle" | "playback";
  mode: MusicContextValue["repeatState"]; x: number; y: number; anchor?: HTMLElement | null; accent: string; surfaceGradient: string;
  transitionMode: MusicContextValue["transitionMode"];
  onTransition: MusicContextValue["setTransitionMode"];
  onShuffle: () => void; shuffle: boolean;
  onSelect: MusicContextValue["setRepeatState"]; onClose: (restoreFocus?: boolean) => void;
}) {
  const { menu, position, onKeyDown } = usePlayerMenu(x, y, anchor, onClose, `${section}:${mode}`);
  return createPortal(<div className={menuThemeClasses} style={{ "--player-accent": accent, "--player-menu-gradient": surfaceGradient } as CSSProperties}>
    <PlayerMenuArrow position={position}/>
    <div ref={menu} className={`${menuClasses} player-mode-menu ${styles.modeMenu} `} style={{ left: position.x, top: position.y }} role="menu" aria-label={section === "shuffle" ? "Queue order" : "Playback modes"} onContextMenu={event => event.preventDefault()} onKeyDown={onKeyDown}>
      {section !== "shuffle" && <div role="group" aria-label="Playback mode">
      {([
        { value: "none", label: "Stop after track", Icon: CircleStop },
        { value: "repeat", label: "Repeat track", Icon: Repeat1 },
        { value: "autoplay", label: "Autoplay", Icon: InfinityIcon },
      ] as const).map(({ value, label, Icon }) => <button key={value} role="menuitemradio" aria-checked={mode === value} onClick={() => { onSelect(value); }}><Icon size={16} aria-hidden="true"/><span>{label}</span>{mode === value && <Check size={16} className={`player-mode-check ${styles.modeCheck}`} aria-hidden="true"/>}</button>)}
      </div>}
      {section !== "shuffle" && mode === "autoplay" && <div role="separator"/>}
      {mode === "autoplay" && <div role="group" aria-label="Queue order">
      {([
        { value: false, label: "In order", Icon: ListOrdered },
        { value: true, label: "Shuffle", Icon: Shuffle },
      ] as const).map(({ value, label, Icon }) => <button key={label} role="menuitemradio" aria-checked={shuffle === value} onClick={() => { if (shuffle !== value) onShuffle(); }}><Icon size={16} aria-hidden="true"/><span>{label}</span>{shuffle === value && <Check size={16} className={`player-mode-check ${styles.modeCheck}`} aria-hidden="true"/>}</button>)}
      </div>}
      {section !== "shuffle" && mode === "autoplay" && <><div role="separator"/>
      <div role="group" aria-label="Track transitions">
      {([
        { value: "off", label: "No transition", Icon: CircleOff },
        { value: "automix", label: "Automix", Icon: AudioLines },
        { value: "crossfade", label: "Crossfade", Icon: Blend },
      ] as const).map(({ value, label, Icon }) => <button key={value} role="menuitemradio" aria-checked={transitionMode === value} onClick={() => { if (transitionMode !== value) onTransition(value); }}><Icon size={16} aria-hidden="true"/><span>{label}</span>{transitionMode === value && <Check size={16} className={`player-mode-check ${styles.modeCheck}`} aria-hidden="true"/>}</button>)}
      </div></>}
    </div>
  </div>, document.body);
}
