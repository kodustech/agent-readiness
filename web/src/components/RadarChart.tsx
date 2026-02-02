import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ReportData } from "../types";

interface Props {
  data: ReportData;
}

export default function RadarChart({ data }: Props) {
  const chartData = data.pillarScores.map((score) => {
    const pillar = data.pillars.find((p) => p.id === score.pillarId);
    return {
      pillar: pillar?.name ?? score.pillarId,
      score: score.percentage,
      fullMark: 100,
    };
  });

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Pillar Radar
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsRadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#2a2a3a" />
          <PolarAngleAxis
            dataKey="pillar"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickCount={5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a25",
              border: "1px solid #2a2a3a",
              borderRadius: "8px",
              color: "#e5e7eb",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${value}%`, "Score"]}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
