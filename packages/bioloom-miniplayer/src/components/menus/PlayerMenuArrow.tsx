import styles from "./PlayerMenuArrow.module.css";
import type { positionPlayerMenu } from "../../lib/menuPosition";

export default function PlayerMenuArrow({ position }: { position: ReturnType<typeof positionPlayerMenu> }) {
  if (!position.width) return null;
  return <span className={`player-menu-arrow ${styles.menuArrow}`} aria-hidden="true" style={{
    left: position.arrowX - 7,
    top: position.arrowY,
    clipPath: position.opensAbove ? "polygon(0 0,100% 0,50% 100%)" : "polygon(50% 0,100% 100%,0 100%)",
    backgroundSize: `${position.width}px 100%`,
    backgroundPosition: `${position.x - position.arrowX + 7}px 0`,
  }}/>;
}
