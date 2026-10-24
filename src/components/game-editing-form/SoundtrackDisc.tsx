import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { RecordDisc, useMusic, type PlayableTrack } from "bioloom-miniplayer";
import { addToast } from "bioloom-ui";

export default function SoundtrackDisc({ track }: { track: PlayableTrack }) {
  const { current, isPlaying, playItem, toggle, clearPlaybackScope } = useMusic();
  const [starting, setStarting] = useState(false);
  const isCurrent = Boolean(track.song && current?.song === track.song && current?.pageVersion === track.pageVersion);
  const playing = isCurrent && isPlaying;

  return <button
    type="button"
    aria-label={`${playing ? "Pause" : "Play"} ${track.name}`}
    aria-pressed={playing}
    aria-busy={starting}
    disabled={!track.song || starting}
    className="group relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--editor-accent)] disabled:cursor-not-allowed disabled:opacity-40"
    onClick={async () => {
      if (isCurrent) {
        clearPlaybackScope();
        toggle();
        return;
      }
      setStarting(true);
      try {
        await playItem(track, [{
          id: track.id, slug: track.slug, name: track.name, url: track.song,
          composer: track.artist, game: track.game, pageVersion: track.pageVersion,
          loudnessGainDb: track.loudnessGainDb, license: track.license,
          allowDownload: track.allowDownload,
          allowBackgroundUse: track.allowBackgroundUse,
          allowBackgroundUseAttribution: track.allowBackgroundUseAttribution,
        }]);
      } catch {
        addToast({ title: "Could not play track." });
      } finally {
        setStarting(false);
      }
    }}
  >
    <RecordDisc artwork={track.thumbnail} className={`h-12 w-12 animate-[spin_8s_linear_infinite] motion-reduce:animate-none ${playing ? "[animation-play-state:running]" : "[animation-play-state:paused]"}`} />
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
      {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
    </span>
  </button>;
}
