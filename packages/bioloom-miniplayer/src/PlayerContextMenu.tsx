import { pageVersionUrl, defaultTrackVersion } from "@/helpers/pageVersionUrl";
import PlayerMenuArrow from "./PlayerMenuArrow";
import { positionPlayerMenu } from "./menuPosition";
import { Music2, UserRound, Gamepad2, Download, ListStart, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "@/compat/next-link";
import { addToast } from "bioloom-ui";
import { getTrackLicense } from "@/helpers/trackLicense";
import { downloadTrackBySlug } from "@/helpers/trackDownload";
import { getTrack } from "@/requests/track";
import { readItem } from "@/requests/helpers";
import type { TrackType as TrackDetails } from "@/types/TrackType";
import type { PlayableTrack } from "./MusicContext";

export default function PlayerContextMenu({ track, x, y, anchor, accent, surfaceGradient, closePlayer, onClose, onPlayNext }: {
  track: PlayableTrack; x: number; y: number; anchor?: HTMLElement | null; accent: string; surfaceGradient: string;
  closePlayer?: () => void; onClose: (restoreFocus?: boolean) => void; onPlayNext?: () => void;
}) {
  const menu = useRef<HTMLDivElement>(null);
  const [details, setDetails] = useState<TrackDetails | null>(null);
  const [position, setPosition] = useState({ x, y, arrowX: x, arrowY: y, opensAbove: true, width: 0 });

  useEffect(() => {
    if (!track.slug) return;
    let cancelled = false;
    void (async () => {
      const response = await getTrack(track.slug!, track.pageVersion);
      if (!response.ok) return;
      let result = await readItem<TrackDetails>(response);
      if (result && track.id != null && result.id !== track.id) {
        const other = await getTrack(track.slug!, result.pageVersion === "POST_JAM" ? "JAM" : "POST_JAM");
        result = other.ok ? await readItem<TrackDetails>(other) : null;
      }
      if (!cancelled && result && (track.id == null || result.id === track.id)) setDetails(result);
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [track.slug, track.id, track.pageVersion]);

  useLayoutEffect(() => {
    if (menu.current) setPosition(positionPlayerMenu(menu.current, x, y, anchor));
  }, [x, y, anchor, details]);

  useEffect(() => {
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) onClose(); };
    const dismiss = () => onClose();
    const onScroll = (event: Event) => { if (!menu.current?.contains(event.target as Node)) onClose(); };
    window.addEventListener("pointerdown", outside);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", onScroll, true);
    return () => { window.removeEventListener("pointerdown", outside); window.removeEventListener("resize", dismiss); window.removeEventListener("scroll", onScroll, true); };
  }, [onClose]);

  const version = details?.pageVersion ?? track.pageVersion;
  const allowDownload = details?.allowDownload ?? track.allowDownload;
  const license = details ? details.license : track.license;
  const allowBackgroundUse = details?.allowBackgroundUse ?? track.allowBackgroundUse;
  const attribution = details?.allowBackgroundUseAttribution ?? track.allowBackgroundUseAttribution;
  const licenseText = license !== undefined ? getTrackLicense(license).label : null;
  const trackHref = track.slug ? pageVersionUrl(`/m/${track.slug}`, version, defaultTrackVersion(details)) : null;
  return createPortal(<div className={"jamjar-yard-player [--player-disc-diameter:116px] [--player-disc-left:-16px] [--player-disc-bottom:-22px] [--compact-disc-left:-14px] [--compact-disc-diameter:82px] [--compact-disc-gap:9px] [--player-accent:#80cfae] [--site-bg:#101b27] [--site-surface:#1a2936] [--site-surface-hover:#263947] [--site-line:#354c59] [--site-accent:#19ff90] [--site-font:Inter,system-ui,sans-serif] text-[#f4f5f2] max-[700px]:[--player-disc-diameter:110px] max-[700px]:[--player-disc-left:-14px] max-[700px]:[--player-disc-bottom:-7px] [&_.record-disc-hole]:[fill:#101b27] [&_.player-color-layer]:[background:linear-gradient(90deg,color-mix(in_srgb,var(--player-accent)_24%,transparent)_0%,color-mix(in_srgb,var(--player-accent)_9%,transparent)_48%,transparent_100%)] [&_.player-bar.is-compact_.player-transport]:gap-0 [&_.player-bar.is-compact_.player-transport_.player-skip]:w-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:h-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:min-w-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:min-h-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:[flex:0_0_28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:p-[3px] [&_.player-bar.is-compact_.player-primary]:w-[28px] [&_.player-bar.is-compact_.player-primary]:h-[28px] [&_.player-bar.is-compact_.player-primary]:min-w-[28px] [&_.player-bar.is-compact_.player-primary]:min-h-[28px] [&_.player-bar.is-compact_.player-primary]:[flex:0_0_28px] [&_.player-bar.is-compact_.player-primary]:p-[3px] [&_.player-identity_a]:text-[inherit] [&_.player-identity_a]:no-underline [&_.player-identity_a:hover]:underline [&_.player-queue]:[--site-surface:#1a2936] [&_.player-queue]:[--site-surface-hover:#263947] [&_.player-queue]:[--site-line:#354c59] [&_.player-queue]:[--site-font:Inter,system-ui,sans-serif] max-[700px]:[&_.player-extras]:gap-[2px] max-[700px]:[&_.player-extras_button]:min-w-[25px] max-[700px]:[&_.player-identity_strong]:text-[13px] [&_.player-rating]:flex [&_.player-rating]:items-center [&_.player-rating]:gap-[1px] [&_.player-rating]:text-[var(--player-accent)] [&_.player-rating_.player-rating-half]:absolute [&_.player-rating_.player-rating-half]:top-0 [&_.player-rating_.player-rating-half]:w-[50%] [&_.player-rating_.player-rating-half]:min-w-0 [&_.player-rating_.player-rating-half]:h-full [&_.player-rating_.player-rating-half]:p-0 [&_.player-rating_.player-rating-half]:text-[inherit] [&_.player-rating_.player-rating-half:focus-visible]:outline-offset-0 [&_[data-touch-menu]]:[-webkit-touch-callout:none] [&_[data-touch-menu]]:select-none "} style={{ "--player-accent": accent, "--player-menu-gradient": surfaceGradient } as CSSProperties}>
    <PlayerMenuArrow position={position}/>
    <div ref={menu} className={"player-context-menu overscroll-contain fixed z-[1000] w-[190px] max-w-[calc(100vw_-_16px)] max-h-[calc(100dvh_-_16px)] overflow-y-auto p-[5px] [border:0] rounded-[10px] [background:var(--player-menu-gradient),var(--site-surface)] text-[#f4f5f2] [box-shadow:0_5px_20px_#0006] [font:600_13px_var(--site-font)] [&_:where([role^='menuitem'])]:flex [&_:where([role^='menuitem'])]:items-center [&_:where([role^='menuitem'])]:gap-[9px] [&_:where([role^='menuitem'])]:w-full [&_:where([role^='menuitem'])]:box-border [&_:where([role^='menuitem'])]:[border:0] [&_:where([role^='menuitem'])]:rounded-[4px] [&_:where([role^='menuitem'])]:p-[8px_10px] [&_:where([role^='menuitem'])]:bg-transparent [&_:where([role^='menuitem'])]:text-[inherit] [&_:where([role^='menuitem'])]:[font:inherit] [&_:where([role^='menuitem'])]:text-left [&_:where([role^='menuitem'])]:no-underline [&_:where([role^='menuitem'])]:cursor-[pointer] [&_[role^='menuitem']:hover:not(:disabled)]:[background:var(--player-accent)] [&_[role^='menuitem']:hover:not(:disabled)]:text-[#101b27] [&_[role^='menuitem']:hover:not(:disabled)]:[outline:none] [&_[role^='menuitem']:focus-visible]:[background:var(--player-accent)] [&_[role^='menuitem']:focus-visible]:text-[#101b27] [&_[role^='menuitem']:focus-visible]:[outline:none] [&_[role^='menuitem']:disabled]:opacity-[.4] [&_[role^='menuitem']:disabled]:cursor-[default] [&_[role='separator']]:h-[1px] [&_[role='separator']]:[background:#ffffff18] [&_[role='separator']]:m-[4px_5px] [&_[role^='menuitem']_svg]:flex-none [&_.player-queue-action]:w-[24px] [&_.player-queue-action]:min-h-[40px] [&_.player-queue-action]:[flex:0_0_24px] [&_.player-queue-action]:justify-center [&_.player-queue-action]:p-[4px] [&_.player-queue-grip]:w-[18px] [&_.player-queue-grip]:basis-[18px] [&_.player-queue-grip]:cursor-[grab] [&_.player-queue-grip]:touch-none [&_.player-queue-play]:flex-1 [&_.player-queue-play]:min-w-0 [&_.player-queue-play]:pl-[4px] [&_.player-queue-play]:pr-[4px] [&_.player-download-item]:grid [&_.player-download-item]:grid-cols-[16px_minmax(0,1fr)] [&_.player-download-item]:items-start [&_.player-download-item]:gap-x-[9px] [&_.player-download-item]:gap-y-[4px] "} role="menu" aria-label="Track actions" style={{ left: position.x, top: position.y }} onContextMenu={event => event.preventDefault()} onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); onClose(true); return; }
      if (event.key === "Tab") { onClose(true); return; }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
      const index = items.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[nextIndex]?.focus();
    }}>
      {onPlayNext && <button role="menuitem" onClick={() => { onClose(); onPlayNext(); }}><ListStart size={16}/><span>Play next</span></button>}
      {trackHref && <Link role="menuitem" onClick={() => onClose()} href={trackHref}><Music2 size={16} aria-hidden="true"/><span>View track</span></Link>}
      {track.artist.slug && <Link role="menuitem" onClick={() => onClose()} href={"/u/" + track.artist.slug}><UserRound size={16} aria-hidden="true"/><span>View artist</span></Link>}
      {track.game.slug && <Link role="menuitem" onClick={() => onClose()} href={pageVersionUrl(`/g/${track.game.slug}`, version, defaultTrackVersion(details))}><Gamepad2 size={16} aria-hidden="true"/><span>View game</span></Link>}
      {allowDownload && track.slug && <button className={"player-download-item [&>svg]:mt-[2px] [&_.player-menu-license]:[grid-column:1_/_-1] [&_.player-menu-license]:min-w-0 "} role="menuitem" onClick={() => {
        onClose();
        void downloadTrackBySlug(track.slug!, track.name, version).catch(() => addToast({ title: "Could not download track." }));
      }}><Download size={16} aria-hidden="true"/><span>Download track</span>{licenseText && <span className={"player-menu-license block text-[11px] font-normal leading-[16px] text-[inherit] opacity-[.8] [&>span]:inline-block [&>span]:p-[2px_6px] [&>span]:rounded-[4px] [&>span]:[background:#ffffff0d] "}><span>{licenseText}{allowBackgroundUse && <>{" "}<span className={"player-stream-label whitespace-nowrap "}>{attribution ? "(Stream safe, credit)" : "(Stream safe)"}</span></>}</span></span>}</button>}
      {closePlayer && <><div role="separator"/>
      <button role="menuitem" onClick={() => { onClose(); closePlayer(); }}><X size={16} aria-hidden="true"/><span>Close player</span></button></>}
    </div>
  </div>, document.body);
}
