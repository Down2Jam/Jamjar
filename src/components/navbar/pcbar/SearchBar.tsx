import { pageVersionUrl } from "@/helpers/pageVersionUrl";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import { Search, X } from "lucide-react";
import { RecordDisc, useMusic } from "bioloom-miniplayer";
import { createPortal } from "react-dom";
import { useTheme } from "@/providers/useSiteTheme";
import { search as searchRequest } from "@/requests/search";
import type { GameType } from "@/types/GameType";
import type { TrackType } from "@/types/TrackType";
import type { UserType } from "@/types/UserType";

type Result = { id: string; title: string; subtitle: string; href: string; artworkUrl?: string; song?: string; pageVersion?: "JAM" | "POST_JAM" };
type Results = { games: Result[]; music: Result[]; users: Result[]; posts: Result[] };
const empty: Results = { games: [], music: [], users: [], posts: [] };

function decodeSearchText(value: string) {
  const decoder = document.createElement("textarea");
  return value.replace(/&(?:#\d+|#x[\da-f]+|[a-z][a-z\d]+);/gi, entity => {
    decoder.innerHTML = entity;
    return decoder.value;
  });
}

function decodeSearchResult(item: Result): Result {
  return { ...item, title: decodeSearchText(item.title), subtitle: decodeSearchText(item.subtitle) };
}

function SearchResultArt({ item, kind }: { item: Result; kind: string }) {
  const { current, isPlaying } = useMusic();
  const playing = isPlaying && (current?.id != null ? String(current.id) === item.id : current?.song === item.song && current?.pageVersion === item.pageVersion);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.artworkUrl]);
  if (kind === "music") return <RecordDisc artwork={item.artworkUrl || "/images/game-thumbnail.png"} className={`search-result-disc animate-[spin_8s_linear_infinite] [animation-play-state:paused] [&.is-playing]:[animation-play-state:running] [@media(prefers-reduced-motion:reduce)]:animate-none ${playing ? " is-playing" : ""}`}/>;
  return item.artworkUrl && !failed ? <img className={`search-result-image${kind === "games" ? " is-game" : ""}`} src={item.artworkUrl} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)}/> : <span className={`search-result-mark grid place-items-center flex-none w-[43px] h-[43px] rounded-[5px] object-cover [background:#304b59] text-[#e3eff0] text-[22px] font-extrabold ${kind === "games" ? " is-game" : ""}`} aria-hidden="true">{item.title.slice(0, 1)}</span>;
}
export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  const id = useId();
  const resultsId = id + "-results";
  const themeStyle = { "--site-line": colors.base, "--site-accent": colors.blue, "--site-text": colors.text, "--site-muted": colors.textFaded, "--site-font": "Inter,system-ui,sans-serif", "--search-surface": colors.mantle, "--search-hover": colors.base } as CSSProperties;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const searchSerial = useRef(0);
  const close = useCallback((restoreFocus = true) => {
    searchSerial.current++;
    setOpen(false);
    setQuery("");
    setResults(empty);
    setActive(-1);
    setLoading(false);
    setError("");
    if (restoreFocus) window.requestAnimationFrame(() => trigger.current?.focus());
  }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (!trigger.current?.getClientRects().length) return;
      const element = event.target as HTMLElement;
      const editing = element.closest("input,textarea,select,[contenteditable=true]");
      const searchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      const legacyShortcut = !editing && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === "s" && !window.location.pathname.includes("theme-elimination");
      if (searchShortcut || legacyShortcut) {
        event.preventDefault();
        setOpen(true);
        window.requestAnimationFrame(() => input.current?.focus());
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => input.current?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "Tab") {
        const focusable = [...(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),a[href]') ?? [])];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keydown); };
  }, [open, close]);
  useEffect(() => {
    if (!open || !query.trim()) { setResults(empty); setLoading(false); setError(""); setActive(-1); return; }
    const controller = new AbortController();
    const serial = searchSerial.current;
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      void searchRequest(query.trim(), { signal: controller.signal }).then(async response => {
        if (!response.ok) throw new Error("Search is unavailable. Try again.");
        const payload = await response.json() as { data: { games?: GameType[]; tracks?: TrackType[]; users?: UserType[]; posts?: { id: number; title: string; slug: string }[] } };
        const data = payload.data;
        return {
          games: (data.games ?? []).map(game => ({ id: String(game.id), title: game.name, subtitle: game.short || "", href: "/g/" + game.slug, artworkUrl: game.thumbnail })).map(decodeSearchResult),
          music: (data.tracks ?? []).map(track => ({ id: String(track.id), song: track.url, pageVersion: track.pageVersion, title: track.name, subtitle: track.composer?.name || track.externalAuthorName || track.game.name, href: pageVersionUrl(`/m/${track.slug}`), artworkUrl: track.game.soundtrackThumbnail || track.game.thumbnail })).map(decodeSearchResult),
          users: (data.users ?? []).map(user => ({ id: String(user.id), title: user.name || user.slug, subtitle: user.short || "@" + user.slug, href: "/u/" + user.slug, artworkUrl: user.profilePicture || undefined })).map(decodeSearchResult),
          posts: (data.posts ?? []).map(post => ({ id: String(post.id), title: post.title, subtitle: "", href: "/p/" + post.slug })).map(decodeSearchResult),
        } satisfies Results;
      }).then(value => { if (!controller.signal.aborted && serial === searchSerial.current) { setResults(value); setActive(-1); setLoading(false); } }).catch(() => { if (!controller.signal.aborted && serial === searchSerial.current) { setError("Search is unavailable. Try again."); setLoading(false); } });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query]);
  const groups = [{ key: "games", title: "Games", items: results.games }, { key: "music", title: "Music", items: results.music }, { key: "users", title: "Users", items: results.users }, { key: "posts", title: "Posts", items: results.posts }];
  const flat = groups.flatMap(group => group.items);
  useEffect(() => {
    if (active >= 0) document.getElementById(id + "-result-" + active)?.scrollIntoView({ block: "nearest" });
  }, [active, id]);
  const openResult = (result: Result) => {
    close(false);
    if (/^https:\/\//.test(result.href)) window.location.assign(result.href);
    else navigate(result.href);
  };
  const keys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && flat.length) { event.preventDefault(); setActive(current => (current + 1) % flat.length); }
    if (event.key === "ArrowUp" && flat.length) { event.preventDefault(); setActive(current => current <= 0 ? flat.length - 1 : current - 1); }
    if (event.key === "Enter" && active >= 0 && flat[active]) { event.preventDefault(); openResult(flat[active]); }
  };
  let resultIndex = 0;
  return <>
    <button ref={trigger} className={`header-search-trigger flex items-center gap-[14px] w-[min(395px,28vw)] h-[43px] ml-auto p-[0_13px] [border:1px_solid_var(--site-line)] rounded-[5px] bg-transparent text-[var(--site-muted)] [font:500_13px_var(--site-font)] text-left cursor-[pointer] [&:hover]:[border-color:var(--site-accent)] [&:hover]:text-[var(--site-text)] [&:focus-visible]:[border-color:var(--site-accent)] [&:focus-visible]:text-[var(--site-text)] [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_kbd]:ml-auto [&_kbd]:text-[var(--site-muted)] [&_kbd]:[font:600_11px_var(--site-font)] [&_kbd]:whitespace-nowrap max-[850px]:w-auto max-[850px]:min-w-[43px] max-[850px]:ml-auto max-[850px]:[&_span]:hidden max-[850px]:[&_kbd]:hidden max-[700px]:h-[38px] max-[700px]:p-[0_9px] [&.is-compact]:w-[38px] [&.is-compact]:min-w-[38px] [&.is-compact]:p-0 [&.is-compact]:justify-center [&.is-compact_span]:hidden [&.is-compact_kbd]:hidden ${compact ? " is-compact" : ""}`} style={themeStyle} type="button" aria-label="Search" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" onClick={() => setOpen(true)}><Search size={20} aria-hidden="true"/><span>Search games, music, users...</span><kbd>Ctrl K</kbd></button>
    {open && createPortal(<div className={"search-backdrop fixed z-[1000] inset-0 flex items-start justify-center p-[clamp(20px,8vh,95px)_16px_20px] [background:rgb(3_8_14_/_78%)] max-[700px]:p-[12px] "} style={themeStyle} onMouseDown={event => { if (event.target === event.currentTarget) close(); }}><div ref={panel} className={"search-panel flex flex-col w-[min(650px,100%)] max-h-[min(680px,calc(100dvh_-_clamp(20px,8vh,95px)_-_20px))] overflow-hidden [border:1px_solid_var(--site-line)] rounded-[12px] [background:var(--search-surface)] text-[var(--site-text)] [box-shadow:0_22px_80px_#0009] [font-family:var(--site-font)] max-[700px]:max-h-[calc(100dvh_-_24px)] "} role="dialog" aria-modal="true" aria-label="Search"><div className={"search-input-row flex items-center gap-[14px] p-[14px_16px] text-[var(--site-text)] [&_input]:w-full [&_input]:min-w-0 [&_input]:p-[8px_0] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:bg-transparent [&_input]:text-[var(--site-text)] [&_input]:[font:600_17px_var(--site-font)] [&_input::placeholder]:text-[var(--site-muted)] [&_button]:flex-none [&_button]:grid [&_button]:place-items-center [&_button]:w-[32px] [&_button]:h-[32px] [&_button]:[border:0] [&_button]:rounded-[6px] [&_button]:bg-transparent [&_button]:text-[var(--site-text)] [&_button]:cursor-[pointer] [&_button:hover]:[background:var(--search-hover)] [&_button:hover]:text-[var(--site-text)] [&_button:focus-visible]:[background:var(--search-hover)] [&_button:focus-visible]:text-[var(--site-text)] [&_input::-webkit-search-cancel-button]:hidden max-[700px]:p-[10px_12px] max-[700px]:[&_input]:text-[15px] "}><Search size={21} aria-hidden="true"/><input ref={input} type="search" role="combobox" aria-label="Search games, music, users and posts" aria-controls={resultsId} aria-expanded="true" aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${id}-result-${active}` : undefined} autoComplete="off" maxLength={80} value={query} onChange={event => { searchSerial.current++; setQuery(event.target.value); setResults(empty); setActive(-1); }} onKeyDown={keys} placeholder="Search games, music, users..."/><button className="search-close" type="button" onClick={() => close()} aria-label="Close search"><X size={20}/></button></div><div id={resultsId} className={"search-results overflow-y-auto p-[4px_12px_16px] min-h-0 "} role="listbox" aria-label="Search results" aria-live="polite">{loading ? <p className={"search-state m-0 p-[24px_15px] text-[var(--site-muted)] text-[14px] "}>Searching...</p> : error ? <p className={"search-state m-0 p-[24px_15px] text-[var(--site-muted)] text-[14px] "}>{error}</p> : !query.trim() ? <p className={"search-state m-0 p-[24px_15px] text-[var(--site-muted)] text-[14px] "}>Search games, music, users, and posts.</p> : !flat.length ? <p className={"search-state m-0 p-[24px_15px] text-[var(--site-muted)] text-[14px] "}>No results for “{query.trim()}”.</p> : groups.map(group => group.items.length ? <section className={"search-group [&_h2]:m-[13px_12px_7px] [&_h2]:text-[var(--site-muted)] [&_h2]:text-[13px] [&_h2]:font-extrabold [&_h2]:normal-case [&_a]:flex [&_a]:items-center [&_a]:gap-[13px] [&_a]:p-[9px_11px] [&_a]:rounded-[7px] [&_a]:text-[var(--site-text)] [&_a]:no-underline [&_a:hover]:[outline:0] [&_a:hover]:[background:var(--search-hover)] [&_a.is-active]:[outline:0] [&_a.is-active]:[background:var(--search-hover)] [&_a:focus-visible]:[outline:2px_solid_var(--site-accent)] [&_a:focus-visible]:[background:var(--search-hover)] [&_a:focus-visible]:outline-offset-[-2px] [&_img]:grid [&_img]:place-items-center [&_img]:flex-none [&_img]:w-[43px] [&_img]:h-[43px] [&_img]:rounded-[5px] [&_img]:object-cover [&_img]:[background:#304b59] [&_img]:text-[#e3eff0] [&_img]:text-[22px] [&_img]:font-extrabold [&_a>span:last-child]:flex [&_a>span:last-child]:flex-col [&_a>span:last-child]:min-w-0 [&_a>span:last-child]:gap-[3px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[14px] [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[var(--site-muted)] [&_small]:text-[12px] [&_.search-result-disc]:flex-none [&_.search-result-disc]:w-[43px] [&_.search-result-disc]:h-[43px] [&_.search-result-disc_.record-disc-label_img]:w-full [&_.search-result-disc_.record-disc-label_img]:h-full [&_.search-result-disc_.record-disc-label_img]:rounded-full [&_.search-result-disc_.record-disc-label_img]:object-cover [&_.search-result-disc_.record-disc-label_img]:bg-transparent [&_.search-result-image.is-game]:w-[76px] [&_.search-result-image.is-game]:h-[43px] [&_.search-result-image.is-game]:aspect-[16/9] [&_.search-result-image.is-game]:object-cover [&_.search-result-mark.is-game]:w-[76px] [&_.search-result-mark.is-game]:h-[43px] [&_.search-result-mark.is-game]:aspect-[16/9] [&_.search-result-mark.is-game]:object-cover [&_.search-result-disc_img]:w-full [&_.search-result-disc_img]:h-full "} key={group.key} aria-label={group.title}><h2>{group.title}</h2>{group.items.map(item => { const index = resultIndex++; const art = <SearchResultArt item={item} kind={group.key}/>; const content = <>{art}<span><strong>{item.title}</strong><small>{item.subtitle}</small></span></>; return /^https:\/\//.test(item.href) ? <a role="option" aria-selected={index === active} id={`${id}-result-${index}`} className={index === active ? "is-active" : ""} key={item.id} href={item.href} onMouseEnter={() => setActive(index)}>{content}</a> : <Link role="option" aria-selected={index === active} id={`${id}-result-${index}`} className={index === active ? "is-active" : ""} key={item.id} to={item.href} onMouseEnter={() => setActive(index)} onClick={() => close(false)}>{content}</Link>; })}</section> : null)}</div></div></div>, document.body)}
  </>;
}
