import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend,
} from "recharts";
import { useTheme } from "@/providers/useSiteTheme";

type RatingChartPoint = { subject: string; A: number; B: number; fullMark: number };

export default function GameRatingChart({ data }: { data: RatingChartPoint[] }) {
  const { colors } = useTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke={colors.crust} />
        <PolarAngleAxis dataKey="subject" tick={{ fill: colors.textFaded, fontSize: 14 }} />
        <PolarRadiusAxis domain={[0, 5]} axisLine={false} tick={false} />
        <Radar name="All" dataKey="B" stroke={colors.magenta} fill={colors.magentaDark} fillOpacity={0.6} />
        <Radar name="Ranked" dataKey="A" stroke={colors.blue} fill={colors.blueDark} fillOpacity={0.6} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
