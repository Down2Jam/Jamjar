import type { positionPlayerMenu } from "./menuPosition";

export default function PlayerMenuArrow({ position }: { position: ReturnType<typeof positionPlayerMenu> }) {
  if (!position.width) return null;
  return <span className={"player-menu-arrow fixed z-[1001] w-[14px] h-[8px] pointer-events-none [background-image:var(--player-menu-gradient)] [background-color:var(--site-surface)] bg-no-repeat "} aria-hidden="true" style={{
    left: position.arrowX - 7,
    top: position.arrowY,
    clipPath: position.opensAbove ? "polygon(0 0,100% 0,50% 100%)" : "polygon(50% 0,100% 100%,0 100%)",
    backgroundSize: `${position.width}px 100%`,
    backgroundPosition: `${position.x - position.arrowX + 7}px 0`,
  }}/>;
}
