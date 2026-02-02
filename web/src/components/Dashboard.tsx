import type { ReportData } from "../types";
import Header from "./Header";
import OverallProgress from "./OverallProgress";
import RadarChart from "./RadarChart";
import PillarCard from "./PillarCard";
import RecommendationList from "./RecommendationList";

interface Props {
  data: ReportData;
}

function PillarSummaryBars({ data }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Pillar Scores
      </h2>
      <div className="space-y-3">
        {data.pillarScores.map((score) => {
          const pillar = data.pillars.find((p) => p.id === score.pillarId);
          const name = pillar ? pillar.name : score.pillarId;
          const icon = pillar?.icon ?? "";
          return (
            <div key={score.pillarId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-300">
                  {icon} {name}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  {score.percentage}%
                </span>
              </div>
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    score.percentage >= 80
                      ? "bg-pass"
                      : score.percentage >= 50
                        ? "bg-accent"
                        : "bg-fail"
                  }`}
                  style={{ width: `${score.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard({ data }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Header data={data} />
      <OverallProgress data={data} />

      {/* Radar + Pillar Summary side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RadarChart data={data} />
        <PillarSummaryBars data={data} />
      </div>

      {/* Pillar detail cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Detailed Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.pillars.map((pillar) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              results={data.results[pillar.id] ?? []}
              score={data.pillarScores.find((s) => s.pillarId === pillar.id)}
            />
          ))}
        </div>
      </div>

      <RecommendationList
        recommendations={data.recommendations}
        pillars={data.pillars}
      />

      {/* Footer */}
      <div className="text-center py-6 border-t border-surface-border">
        <p className="text-sm text-gray-500">
          Powered by{" "}
          <a
            href="https://kodus.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-light transition-colors"
          >
            Kodus
          </a>
        </p>
      </div>
    </div>
  );
}
