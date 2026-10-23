export type MiniCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// A gesture selects the next corner; the bar stays anchored until release.
export function cornerFromMiniDrag(corner: MiniCorner, dx: number, dy: number, threshold = 24): MiniCorner {
  const horizontalTravel = Math.abs(dx);
  const verticalTravel = Math.abs(dy);
  if (Math.hypot(dx, dy) < threshold) return corner;
  const axisDeadZone = Math.max(12, Math.max(horizontalTravel, verticalTravel) * 0.2);
  const changeHorizontal = horizontalTravel >= axisDeadZone;
  const changeVertical = verticalTravel >= axisDeadZone;
  const vertical = changeVertical ? (dy < 0 ? "top" : "bottom") : corner.split("-")[0];
  const horizontal = changeHorizontal ? (dx < 0 ? "left" : "right") : corner.split("-")[1];
  return `${vertical}-${horizontal}` as MiniCorner;
}

export function arrowMiniCorner(corner: MiniCorner, key: string): MiniCorner {
  const vertical = key === "ArrowUp" ? "top" : key === "ArrowDown" ? "bottom" : corner.split("-")[0];
  const horizontal = key === "ArrowLeft" ? "left" : key === "ArrowRight" ? "right" : corner.split("-")[1];
  return `${vertical}-${horizontal}` as MiniCorner;
}
