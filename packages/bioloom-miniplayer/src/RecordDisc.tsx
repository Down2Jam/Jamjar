import { useEffect, useState } from "react";
import { Play } from "lucide-react";

export default function RecordDisc({ artwork, trackKey, discRef, className = "player-disc absolute left-[var(--player-disc-left)] bottom-[var(--player-disc-bottom)] w-[var(--player-disc-diameter)] h-[var(--player-disc-diameter)] ", showPlayOverlay = false }: { artwork: string; trackKey?: string; discRef?: React.RefObject<HTMLSpanElement | null>; className?: string; showPlayOverlay?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [artwork]);
  return <span ref={discRef} className={`record-disc relative box-border grid place-items-center overflow-hidden rounded-full bg-transparent shadow-none origin-center  ${className}`} data-record-track={trackKey} aria-hidden="true">
    <span className={"record-disc-label relative block w-full h-full overflow-hidden rounded-full [background:#28433b] [container-type:size] [&_img]:block [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&>span]:grid [&>span]:place-items-center [&>span]:w-full [&>span]:h-full [&>span]:text-[35cqw] [&>span]:text-[#f0f8f3]  player-disc-label"}>{artwork && !failed ? <img src={artwork} alt="" onError={() => setFailed(true)}/> : <span>♫</span>}</span>
    <svg className={"record-disc-details absolute inset-0 w-full h-full pointer-events-none overflow-visible "} viewBox="0 0 100 100" aria-hidden="true"><circle className={"record-disc-inner-ring [vector-effect:none] [fill:none] [stroke:#07111a66] [stroke-width:.75] "} cx="50" cy="50" r="19"/><circle className={"record-disc-hole [vector-effect:none] [fill:var(--site-bg)] [stroke:#d5eee3] [stroke-width:1.7] "} cx="50" cy="50" r="6.9"/></svg>
    {showPlayOverlay && <span className={"record-disc-action absolute z-[2] left-[50%] top-[50%] [transform:translate(-50%,-50%)] grid place-items-center w-[74%] aspect-[1] p-0 [border:0] rounded-full bg-transparent text-[#e5fff0] [filter:drop-shadow(0_2px_5px_#07111acc)] cursor-[pointer] opacity-0 pointer-events-none [transition:opacity_.14s_ease] [&_span]:grid [&_span]:place-items-center [&_span]:w-full [&_span]:h-full [&_svg]:w-full [&_svg]:h-full [&_svg]:[stroke-width:1.3] [&_[data-icon=play]_svg]:[transform:translateX(-6%)] [&:focus-visible]:[outline:3px_solid_var(--site-accent)] [&:focus-visible]:outline-offset-[3px] [@media(prefers-reduced-motion:reduce)]:transition-none "}><Play fill="currentColor"/></span>}
  </span>;
}

