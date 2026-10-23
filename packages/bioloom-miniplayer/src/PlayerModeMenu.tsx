import PlayerMenuArrow from "./PlayerMenuArrow";
import { positionPlayerMenu } from "./menuPosition";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AudioLines, Blend, Check, Infinity as InfinityIcon, ListOrdered, Repeat1, Shuffle, CircleStop, CircleOff } from "lucide-react";
import type { MusicContextValue } from "./MusicContext";

export default function PlayerModeMenu({ section = "all", mode, x, y, anchor, accent, surfaceGradient, onSelect, onShuffle, shuffle, transitionMode, onTransition, onClose }: {
  section?: "all" | "shuffle" | "playback";
  mode: MusicContextValue["repeatState"]; x: number; y: number; anchor?: HTMLElement | null; accent: string; surfaceGradient: string;
  transitionMode: MusicContextValue["transitionMode"];
  onTransition: MusicContextValue["setTransitionMode"];
  onShuffle: () => void; shuffle: boolean;
  onSelect: MusicContextValue["setRepeatState"]; onClose: (restoreFocus?: boolean) => void;
}) {
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y, arrowX: x, arrowY: y, opensAbove: true, width: 0 });
  useLayoutEffect(() => {
    if (menu.current) setPosition(positionPlayerMenu(menu.current, x, y, anchor));
  }, [x, y, anchor, section, mode]);
  useEffect(() => {
    menu.current?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled)')?.focus();
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
    <div ref={menu} className={"player-context-menu overscroll-contain fixed z-[1000] w-[190px] max-w-[calc(100vw_-_16px)] max-h-[calc(100dvh_-_16px)] overflow-y-auto p-[5px] [border:0] rounded-[10px] [background:var(--player-menu-gradient),var(--site-surface)] text-[#f4f5f2] [box-shadow:0_5px_20px_#0006] [font:600_13px_var(--site-font)] [&_:where([role^='menuitem'])]:flex [&_:where([role^='menuitem'])]:items-center [&_:where([role^='menuitem'])]:gap-[9px] [&_:where([role^='menuitem'])]:w-full [&_:where([role^='menuitem'])]:box-border [&_:where([role^='menuitem'])]:[border:0] [&_:where([role^='menuitem'])]:rounded-[4px] [&_:where([role^='menuitem'])]:p-[8px_10px] [&_:where([role^='menuitem'])]:bg-transparent [&_:where([role^='menuitem'])]:text-[inherit] [&_:where([role^='menuitem'])]:[font:inherit] [&_:where([role^='menuitem'])]:text-left [&_:where([role^='menuitem'])]:no-underline [&_:where([role^='menuitem'])]:cursor-[pointer] [&_[role^='menuitem']:hover:not(:disabled)]:[background:var(--player-accent)] [&_[role^='menuitem']:hover:not(:disabled)]:text-[#101b27] [&_[role^='menuitem']:hover:not(:disabled)]:[outline:none] [&_[role^='menuitem']:focus-visible]:[background:var(--player-accent)] [&_[role^='menuitem']:focus-visible]:text-[#101b27] [&_[role^='menuitem']:focus-visible]:[outline:none] [&_[role^='menuitem']:disabled]:opacity-[.4] [&_[role^='menuitem']:disabled]:cursor-[default] [&_[role='separator']]:h-[1px] [&_[role='separator']]:[background:#ffffff18] [&_[role='separator']]:m-[4px_5px] [&_[role^='menuitem']_svg]:flex-none [&_.player-queue-action]:w-[24px] [&_.player-queue-action]:min-h-[40px] [&_.player-queue-action]:[flex:0_0_24px] [&_.player-queue-action]:justify-center [&_.player-queue-action]:p-[4px] [&_.player-queue-grip]:w-[18px] [&_.player-queue-grip]:basis-[18px] [&_.player-queue-grip]:cursor-[grab] [&_.player-queue-grip]:touch-none [&_.player-queue-play]:flex-1 [&_.player-queue-play]:min-w-0 [&_.player-queue-play]:pl-[4px] [&_.player-queue-play]:pr-[4px] [&_.player-download-item]:grid [&_.player-download-item]:grid-cols-[16px_minmax(0,1fr)] [&_.player-download-item]:items-start [&_.player-download-item]:gap-x-[9px] [&_.player-download-item]:gap-y-[4px]  player-mode-menu w-[210px] "} style={{ left: position.x, top: position.y }} role="menu" aria-label={section === "shuffle" ? "Queue order" : "Playback modes"} onContextMenu={event => event.preventDefault()} onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); onClose(true); return; }
      if (event.key === "Tab") { onClose(true); return; }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)') ?? []);
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }}>
      {section !== "shuffle" && <div role="group" aria-label="Playback mode">
      {([
        { value: "none", label: "Stop after track", Icon: CircleStop },
        { value: "repeat", label: "Repeat track", Icon: Repeat1 },
        { value: "autoplay", label: "Autoplay", Icon: InfinityIcon },
      ] as const).map(({ value, label, Icon }) => <button key={value} role="menuitemradio" aria-checked={mode === value} onClick={() => { onSelect(value); }}><Icon size={16} aria-hidden="true"/><span>{label}</span>{mode === value && <Check size={16} className={"player-mode-check ml-auto "} aria-hidden="true"/>}</button>)}
      </div>}
      {section !== "shuffle" && mode === "autoplay" && <div role="separator"/>}
      {mode === "autoplay" && <div role="group" aria-label="Queue order">
      {([
        { value: false, label: "In order", Icon: ListOrdered },
        { value: true, label: "Shuffle", Icon: Shuffle },
      ] as const).map(({ value, label, Icon }) => <button key={label} role="menuitemradio" aria-checked={shuffle === value} onClick={() => { if (shuffle !== value) onShuffle(); }}><Icon size={16} aria-hidden="true"/><span>{label}</span>{shuffle === value && <Check size={16} className={"player-mode-check ml-auto "} aria-hidden="true"/>}</button>)}
      </div>}
      {section !== "shuffle" && mode === "autoplay" && <><div role="separator"/>
      <div role="group" aria-label="Track transitions">
      {([
        { value: "off", label: "No transition", Icon: CircleOff },
        { value: "automix", label: "Automix", Icon: AudioLines },
        { value: "crossfade", label: "Crossfade", Icon: Blend },
      ] as const).map(({ value, label, Icon }) => <button key={value} role="menuitemradio" aria-checked={transitionMode === value} onClick={() => { if (transitionMode !== value) onTransition(value); }}><Icon size={16} aria-hidden="true"/><span>{label}</span>{transitionMode === value && <Check size={16} className={"player-mode-check ml-auto "} aria-hidden="true"/>}</button>)}
      </div></>}
    </div>
  </div>, document.body);
}
