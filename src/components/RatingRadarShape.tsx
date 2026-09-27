import { useId } from "react";
import { getRatingColor } from "@/helpers/ratingColor";

type RatingPoint = {
  x: number;
  y: number;
  cx?: number;
  cy?: number;
  angle: number;
  value?: number;
  payload?: { placement?: number };
};

/** Keeps the chart's geometry while coloring each axis like its rating. */
export function RatingRadarShape({
  points = [],
  colors,
  fillOpacity = 0.55,
}: {
  points?: RatingPoint[];
  colors: Record<string, string>;
  fillOpacity?: number;
}) {
  const id = useId().replace(/:/g, "");
  if (points.length < 3) return <g />;

  const cx = points[0].cx ?? 0;
  const cy = points[0].cy ?? 0;
  const radius = Math.max(1, ...points.map((p) => Math.hypot(p.x - cx, p.y - cy)));
  const ratings = points.map((point) => {
    const placement = point.payload?.placement ?? 0;
    const podium = placement >= 1 && placement <= 3;
    return {
      angle: ((90 - point.angle) % 360 + 360) % 360,
      color: podium ? "#f5ad32" : getRatingColor(point.value ?? 0, colors),
    };
  });
  const stops = ratings.flatMap((rating) =>
    [-360, 0, 360].map((offset) => ({ angle: rating.angle + offset, color: rating.color })),
  ).sort((a, b) => a.angle - b.angle);

  return (
    <g pointerEvents="none">
      <defs>
        <clipPath id={`${id}-clip`}>
          <polygon points={points.map((p) => `${p.x},${p.y}`).join(" ")} />
        </clipPath>
        {points.map((point, index) => {
          const next = points[(index + 1) % points.length];
          return (
            <linearGradient key={index} id={`${id}-edge-${index}`} gradientUnits="userSpaceOnUse"
              x1={point.x} y1={point.y} x2={next.x} y2={next.y}>
              <stop offset="0%" stopColor={ratings[index].color} />
              <stop offset="100%" stopColor={ratings[(index + 1) % points.length].color} />
            </linearGradient>
          );
        })}
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <foreignObject x={cx - radius} y={cy - radius} width={radius * 2} height={radius * 2} opacity={fillOpacity}>
          <div style={{ width: "100%", height: "100%", background: `conic-gradient(${stops.map((stop) => `${stop.color} ${stop.angle}deg`).join(", ")})` }} />
        </foreignObject>
      </g>
      {points.map((point, index) => {
        const next = points[(index + 1) % points.length];
        return <line key={index} x1={point.x} y1={point.y} x2={next.x} y2={next.y}
          stroke={`url(#${id}-edge-${index})`} strokeWidth={1.5} />;
      })}
    </g>
  );
}
