import { Text } from "recharts";

export function RatingRadarLabel({
  x,
  y,
  payload,
  textAnchor,
  color,
  fontSize = 12,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
  textAnchor?: "start" | "middle" | "end";
  color: string;
  fontSize?: number;
}) {
  return (
    <Text x={x} y={y} width={85} textAnchor={textAnchor} verticalAnchor="middle"
      fill={color} stroke="none" fontSize={fontSize}>
      {payload?.value ?? ""}
    </Text>
  );
}
