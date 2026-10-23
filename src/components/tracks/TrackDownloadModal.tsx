import { pageVersionUrl, defaultGameVersion } from "@/helpers/pageVersionUrl";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, Download, Files, MonitorOff, Tv, X } from "lucide-react";
import LicenseMark from "@/components/tracks/LicenseMark";
import { RecordDisc } from "bioloom-miniplayer";
import { useTheme } from "@/providers/useSiteTheme";
import { getTrackDownloadDetails } from "@/requests/track";
import { readItem } from "@/requests/helpers";
import { getSelectedGamePage, materializeGamePage } from "@/helpers/gamePages";
import { getTrackLicense, normalizeTrackLicense } from "@/helpers/trackLicense";
import { createAlbumCover, fetchTrackDownload, saveTrackDownload, sanitizeDownloadBaseName, type TrackDownloadRequest } from "@/helpers/trackDownload";
import type { TrackType } from "@/types/TrackType";
import type { GameType } from "@/types/GameType";

function licenseTerms(track: TrackType) {
  const code = normalizeTrackLicense(track.license);
  if (code === "ALL_RIGHTS_RESERVED") return "Download for personal listening. This does not grant permission to redistribute, remix, or use the track in a project.";
  if (code === "CC0_1_0") return "You may copy, remix, and use this track commercially. Attribution is not required under CC0.";
  return [
    "Credit the creator, link to the license, retain supplied notices, and identify changes.",
    code.includes("_NC_") ? "Commercial use is not permitted under this license." : "Commercial use is permitted under the license terms.",
    code.includes("_ND_") ? "Do not share adapted versions. Synchronizing music to video is an adaptation." : "Remixing and adapting are permitted.",
    code.includes("_SA_") ? "Shared adaptations must use the same or a compatible license." : "",
  ].filter(Boolean).join(" ");
}

const creditsDetails = "Check the credits and licenses file for specific details on each track.";

function streamTerms(track: TrackType, plural = false) {
  if (!track.allowBackgroundUse) {
    return "Any stream use outside of playing the game must be done with separate permission.";
  }

  const subject = plural ? "These tracks have" : "This track has";
  const music = plural ? "the tracks" : "the track";
  if (track.allowBackgroundUseAttribution) {
    return `${subject} been marked as stream safe (credit) by the uploader! This means they give you permission to use it in the background of live streams or videos provided you credit them for making ${music} somewhere. This could be somewhere such as the description of the stream/video or on screen as its playing.`;
  }
  return `${subject} been marked as stream safe by the uploader! This means they give you permission to use it in the background of live streams or videos. You do not need to credit them in the description or within the stream/video when its used in this way but you can optionally still do so if you wish. You should not claim that you created ${music}.`;
}

function getStreamSummary(tracks: TrackType[], wholeAlbum: boolean) {
  const someStreamSafe = tracks.some(track => track.allowBackgroundUse);
  const allStreamSafe = tracks.every(track => track.allowBackgroundUse);
  if (!someStreamSafe) {
    return { safe: false, title: "Not stream safe", description: streamTerms(tracks[0]) };
  }
  if (!allStreamSafe) {
    return { safe: true, title: "Some tracks are stream safe", description: creditsDetails };
  }

  const requiresCredit = Boolean(tracks[0].allowBackgroundUseAttribution);
  const mixedAttribution = tracks.some(track => Boolean(track.allowBackgroundUseAttribution) !== requiresCredit);
  if (mixedAttribution) {
    return {
      safe: true,
      title: "Stream safe",
      description: `All tracks are marked as stream safe with some requiring credit and others not. ${creditsDetails}`,
    };
  }
  return {
    safe: true,
    title: requiresCredit ? "Stream safe (credit)" : "Stream safe",
    description: streamTerms(tracks[0], wholeAlbum && tracks.length > 1),
  };
}

function TrackTerms({ tracks, wholeAlbum }: { tracks: TrackType[]; wholeAlbum: boolean }) {
  const track = tracks[0];
  if (!track) return null;

  const license = getTrackLicense(track.license);
  const multipleLicenses = tracks.some(item => normalizeTrackLicense(item.license) !== normalizeTrackLicense(track.license));
  const stream = getStreamSummary(tracks, wholeAlbum);

  return <section className={"track-download-terms flex flex-col gap-[5px] mt-[16px] pt-[16px] [border-top:1px_solid_var(--download-line)] [&_strong]:text-[15px] [&_a]:text-[var(--download-accent)] [&_a]:w-fit [&_a]:underline [&_p]:m-[3px_0] "}>
    <div className="flex items-center gap-2">
      {multipleLicenses ? <Files size={16} className="shrink-0" aria-hidden="true" /> : <LicenseMark license={normalizeTrackLicense(track.license)} />}
      {multipleLicenses ? <b>Multiple Licenses</b> : normalizeTrackLicense(track.license) === "ALL_RIGHTS_RESERVED" ? <b>{license.label}</b> : <a href={license.url} target="_blank" rel="noreferrer">{license.label}</a>}
    </div>
    <p>{multipleLicenses ? `License differs per track. ${creditsDetails}` : licenseTerms(track)}</p>
    <div>
      <b className="flex items-center gap-2">
        {stream.safe ? <Tv size={16} className="shrink-0" aria-hidden="true" /> : <MonitorOff size={16} className="shrink-0" aria-hidden="true" />}
        {stream.title}
      </b>
      <p>{stream.description}</p>
    </div>
  </section>;
}

export default function TrackDownloadModal() {
  const { colors } = useTheme();
  const dialog = useRef<HTMLDialogElement>(null);
  const activeRequest = useRef<TrackDownloadRequest | null>(null);
  const [request, setRequest] = useState<TrackDownloadRequest | null>(null);
  const [track, setTrack] = useState<TrackType | null>(null);
  const [album, setAlbum] = useState<GameType | null>(null);
  const [albumError, setAlbumError] = useState(false);
  const [scope, setScope] = useState<"track" | "album">("track");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [retry, setRetry] = useState(0);
  const close = () => {
    if (busy) return;
    dialog.current?.close();
    activeRequest.current?.resolve();
    activeRequest.current = null;
    setRequest(null);
  };

  useEffect(() => {
    const open = (event: Event) => {
      const next = (event as CustomEvent<TrackDownloadRequest>).detail;
      if (activeRequest.current) { next.resolve(); return; }
      activeRequest.current = next;
      setRequest(next);
      setScope("track");
      setTrack(null);
      setAlbum(null);
      setError("");
      setLoading(true);
    };
    window.addEventListener("track-download-request", open);
    return () => {
      window.removeEventListener("track-download-request", open);
      activeRequest.current?.resolve();
    };
  }, []);

  useEffect(() => {
    if (!request) return;
    dialog.current?.showModal();
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setAlbumError(false);
    void (async () => {
      const response = await getTrackDownloadDetails(request.trackSlug, request.pageVersion ?? "JAM", controller.signal);
      if (!response.ok) throw new Error("Could not load track details.");
      const details = await readItem<{ track: TrackType; game: GameType }>(response);
      const item = details?.track;
      if (!item || (request.pageVersion && item.pageVersion && request.pageVersion !== item.pageVersion)) throw new Error("This track version is unavailable.");
      if (cancelled) return;
      setTrack(item);
      try {
        if (!item.game?.slug) throw new Error();
        const version = item.pageVersion ?? request.pageVersion ?? "JAM";
        const game = details?.game ?? null;
        const page = getSelectedGamePage(game, version);
        if (!game || !page || !Array.isArray(page.tracks)) throw new Error();
        if (!cancelled) setAlbum(materializeGamePage(game, page));
      } catch {
        if (!cancelled) setAlbumError(true);
      }
    })().catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [request, retry]);

  const downloadable = album?.tracks.filter(item => item.allowDownload && item.slug) ?? [];
  const artwork = (song: TrackType | null | undefined) => song?.image || song?.game?.soundtrackThumbnail || song?.game?.thumbnail || album?.soundtrackThumbnail || album?.thumbnail || "/images/game-thumbnail.png";
  const firstAlbumTrack = album?.tracks[0];
  const lastAlbumTrack = album?.tracks[album.tracks.length - 1];
  const selected = scope === "album" ? downloadable : track ? [track] : [];
  const blockedCount = (album?.tracks.length ?? 0) - downloadable.length;
  const download = async () => {
    if (!track || busy || !selected.length) return;
    setBusy(true);
    setError("");
    try {
      const version = track.pageVersion ?? request?.pageVersion ?? "JAM";
      if (scope === "track") {
        const file = await fetchTrackDownload(track.slug, track.name, version);
        saveTrackDownload(file.blob, file.filename);
      } else {
        const { zip, strToU8 } = await import("fflate");
        const files: Record<string, Uint8Array> = {};
        setProgress("Preparing cover");
        files["cover.png"] = await createAlbumCover(album?.soundtrackThumbnail, album?.thumbnail);
        for (const [index, item] of selected.entries()) {
          setProgress(`Preparing ${index + 1} of ${selected.length}`);
          const file = await fetchTrackDownload(item.slug, item.name, item.pageVersion ?? version);
          const filename = `${String(index + 1).padStart(2, "0")} ${sanitizeDownloadBaseName(file.filename)}`;
          files[filename] = new Uint8Array(await file.blob.arrayBuffer());
        }
        files["Credits and licenses.txt"] = strToU8(selected.map(item => [
          `${item.name} - ${item.composer?.name || item.externalAuthorName || "Unknown artist"}`,
          pageVersionUrl(`${window.location.origin}/m/${item.slug}`, item.pageVersion ?? version, defaultGameVersion(album)),
          normalizeTrackLicense(item.license) === "ALL_RIGHTS_RESERVED" ? getTrackLicense(item.license).label : `${getTrackLicense(item.license).label} (${getTrackLicense(item.license).url})`,
          licenseTerms(item),
          streamTerms(item),
        ].filter(Boolean).join("\n")).join("\n\n"));
        setProgress("Preparing album");
        const archive = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => zip(files, { level: 0 }, (err, data) => err ? reject(err) : resolve(data as Uint8Array<ArrayBuffer>)));
        saveTrackDownload(new Blob([archive], { type: "application/zip" }), sanitizeDownloadBaseName(album?.name || "Soundtrack") + ".zip");
      }
      dialog.current?.close();
      activeRequest.current?.resolve();
      activeRequest.current = null;
      setRequest(null);
    } catch {
      setError("Could not download. Please try again.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return <dialog ref={dialog} className={"track-download-dialog m-auto w-[min(580px,calc(100vw_-_32px))] max-h-[calc(100dvh_-_48px)] p-0 [border:1px_solid_var(--download-line)] rounded-[12px] [background:var(--download-bg)] text-[var(--download-text)] [box-shadow:0_20px_70px_#0009] overflow-auto overscroll-contain [&::backdrop]:[background:#000a] [&_header]:flex [&_header]:items-center [&_header]:justify-between [&_header]:p-[18px_22px] [&_header]:[border-bottom:1px_solid_var(--download-line)] [&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:m-0 [&_button]:cursor-[pointer] [&_button]:rounded-[6px] [&_button]:p-[8px_12px] [&_button:disabled]:cursor-[default] [&_button:disabled]:opacity-[.5] [&_:focus-visible]:[outline:2px_solid_var(--download-accent)] [&_:focus-visible]:outline-offset-[3px] [&_footer]:flex [&_footer]:justify-end [&_footer]:gap-[8px] [&_footer]:p-[16px_22px] [&_footer]:[border-top:1px_solid_var(--download-line)] "} aria-labelledby="track-download-heading" style={{ "--download-bg": colors.mantle, "--download-text": colors.text, "--download-muted": colors.textFaded, "--download-accent": colors.blue, "--download-line": colors.base } as CSSProperties} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
    <header><h2 id="track-download-heading">Download music</h2><button type="button" className="track-download-close" onClick={close} disabled={busy} aria-label="Close"><X size={20}/></button></header>
    <div className={"track-download-body p-[20px_22px] text-[13px] leading-[1.5] "}>
      <fieldset disabled={busy || loading} className="track-download-options m-0 mb-5 grid grid-cols-2 gap-4 border-0 p-0 [&_.record-disc-hole]:[fill:var(--download-bg)] disabled:opacity-60">
        <legend className="sr-only">Download selection</legend>
        {(["track", "album"] as const).map(option => {
          const selected = scope === option;
          const unavailable = option === "album" && (!album || downloadable.length === 0);
          return <label key={option} className={`group relative flex min-w-0 flex-col items-center gap-3 rounded-lg px-2 py-3 text-center transition-opacity duration-150 motion-reduce:transition-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--download-accent)] ${unavailable ? "cursor-default opacity-30" : selected ? "cursor-pointer opacity-100" : "cursor-pointer opacity-50 hover:opacity-80 focus-within:opacity-80"}`}>
            <input className="sr-only" type="radio" name="download-scope" checked={selected} disabled={unavailable} onChange={() => setScope(option)} />
            <span className="relative grid h-24 w-24 shrink-0 place-items-center" aria-hidden="true">
              {option === "track" ? <RecordDisc artwork={artwork(track)} className="h-20 w-20 drop-shadow-[0_3px_5px_#0005]" /> : <>
                <span className="absolute right-0 top-0"><RecordDisc artwork={artwork(lastAlbumTrack)} className="h-20 w-20 drop-shadow-[0_3px_5px_#0005]" /></span>
                <span className="absolute bottom-0 left-0"><RecordDisc artwork={artwork(firstAlbumTrack)} className="h-20 w-20 drop-shadow-[0_3px_5px_#0005]" /></span>
              </>}
              {selected && <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--download-accent)] text-[var(--download-bg)] ring-[3px] ring-[var(--download-bg)]"><Check size={15} strokeWidth={3} /></span>}
            </span>
            <span className="min-w-0 [overflow-wrap:anywhere]">
              <strong className="block text-[15px]">{option === "track" ? "Just this song" : "Whole album"}</strong>
              <small className="mt-1 block text-[var(--download-muted)]">{option === "track" ? track?.name || request?.fallbackName : album ? `${album.name} (${downloadable.length} ${downloadable.length === 1 ? "track" : "tracks"})` : "Game soundtrack"}</small>
            </span>
          </label>;
        })}
      </fieldset>
      {loading ? <p role="status">Loading download details…</p> : <>
        {albumError && <p className={"track-download-muted text-[var(--download-muted)] "}>Album unavailable. <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
        {scope === "album" && blockedCount > 0 && <p className={"track-download-muted text-[var(--download-muted)] "}>{blockedCount} {blockedCount === 1 ? "track is" : "tracks are"} excluded because downloads are disabled.</p>}
        <TrackTerms tracks={selected} wholeAlbum={scope === "album"} />
        {track && !track.allowDownload && scope === "track" && <p>Downloads are disabled for this track.</p>}
      </>}
      {error && <p role="alert">{error} {!track && <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button>}</p>}
    </div>
    <footer><button type="button" onClick={close} disabled={busy}>Cancel</button><button type="button" className={"track-download-confirm flex items-center gap-[8px] [background:var(--download-accent)] text-[var(--download-bg)] font-semibold "} disabled={busy || loading || !selected.length || (scope === "track" && !track?.allowDownload)} onClick={() => void download()}><Download size={17}/>{busy ? progress || "Preparing download…" : scope === "album" ? "Download album" : "Download song"}</button></footer>
  </dialog>;
}
