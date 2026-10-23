import { useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { Button } from "bioloom-ui";
import { useMusic } from "bioloom-miniplayer";
import SidebarSong from "@/components/sidebar/SidebarSong";
import { useTheme } from "@/providers/useSiteTheme";
import { usePageMetadata } from "@/hooks/usePageMetadata";

export default function HistoryPage() {
  const { history } = useMusic();
  const { colors } = useTheme();
  const [limit, setLimit] = useState(50);
  usePageMetadata({ title: "Listening history", robots: "noindex" });
  return <section className={"music-library-shell box-border w-full max-w-[1120px] m-[0_auto] gap-[18px]! [background:var(--music-surface)] text-[var(--music-text)] [box-shadow:-22px_0_34px_-18px_rgb(0_0_0_/_78%),22px_0_34px_-18px_rgb(0_0_0_/_78%)] max-[700px]:gap-[14px]!  album-page text-[var(--music-text)] p-[24px] rounded-[16px] overflow-hidden [&_a]:text-[var(--music-accent)] [&_a:hover]:underline max-[600px]:p-[16px] "} style={{ "--music-surface": colors.mantle, "--music-text": colors.text, "--music-muted": colors.textFaded, "--music-accent": colors.blue, "--music-line": colors.base } as CSSProperties}>
    <nav className={"album-navigation flex justify-between gap-[16px] mb-[24px] "}><Link to="/music">Music</Link></nav>
    <header className={"album-heading flex gap-[28px] items-center mb-[24px] [&_h1]:text-[28px] [&_h1]:font-bold [&_h1]:leading-[1.2] [&_p]:text-[var(--music-muted)] [&_p]:mt-[6px] max-[600px]:gap-[16px] max-[600px]:items-start max-[600px]:[&_h1]:text-[22px] "}><h1>Listening history</h1></header>
    {!history.length ? <p>No playback history yet.</p> : history.slice(0, limit).map((track, index) => <div key={`${track.playedAt}:${index}`}>
      {track.playedAt && <time className={"history-played-at block text-[var(--music-muted)] text-[12px] m-[14px_0_5px] "} dateTime={new Date(track.playedAt).toISOString()}>{new Date(track.playedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>}
      <SidebarSong slug={track.slug} trackId={track.id} name={track.name} artist={track.composer} thumbnail={track.game.soundtrackThumbnail || track.game.thumbnail || "/images/game-thumbnail.png"} song={track.url} game={track.game} pageVersion={track.pageVersion}
        loudnessGainDb={track.loudnessGainDb} license={track.license} allowDownload={track.allowDownload} allowBackgroundUse={track.allowBackgroundUse} allowBackgroundUseAttribution={track.allowBackgroundUseAttribution} wide showRating={false} rowIndex={index}/>
    </div>)}
    {history.length > limit && <Button onClick={() => setLimit(value => value + 50)}>Show more</Button>}
  </section>;
}
