import styles from "./RecordDisc.module.css";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";

export default function RecordDisc({ artwork, trackKey, discRef, className = `player-disc ${styles.defaultPosition}`, showPlayOverlay = false }: { artwork: string; trackKey?: string; discRef?: React.RefObject<HTMLSpanElement | null>; className?: string; showPlayOverlay?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [artwork]);
  return <span ref={discRef} className={` record-disc ${styles.disc} ${className}`} data-record-track={trackKey} aria-hidden="true">
    <span className={`record-disc-label player-disc-label ${styles.discLabel}`}>{artwork && !failed ? <img src={artwork} alt="" onError={() => setFailed(true)}/> : <span>♫</span>}</span>
    <svg className={`record-disc-details ${styles.discDetails}`} viewBox="0 0 100 100" aria-hidden="true"><circle className="record-disc-inner-ring" fill="none" stroke="#07111a66" strokeWidth=".75" cx="50" cy="50" r="19"/><circle className="record-disc-hole" fill="var(--site-bg, #101b27)" stroke="#d5eee3" strokeWidth="1.7" cx="50" cy="50" r="6.9"/></svg>
    {showPlayOverlay && <span className={`record-disc-action ${styles.discAction}`}><Play fill="currentColor"/></span>}
  </span>;
}

