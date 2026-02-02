import type { Recommendation, SerializedPillar } from "../types";

interface Props {
  recommendations: Recommendation[];
  pillars: SerializedPillar[];
}

const EFFORT_STYLES: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
};

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function RecommendationList({ recommendations, pillars }: Props) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-surface-card border border-pass/30 rounded-xl p-6 text-center">
        <p className="text-pass font-semibold text-lg mb-1">
          All checks passing!
        </p>
        <p className="text-gray-400 text-sm">
          Your repository is fully agent-ready.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Top Recommendations
      </h2>
      <div className="space-y-3">
        {recommendations.map((rec, i) => {
          const pillar = pillars.find((p) => p.id === rec.pillarId);
          const pillarName = pillar?.name ?? rec.pillarId;

          return (
            <div
              key={rec.criterionId}
              className="bg-surface-card border border-surface-border rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold text-sm mt-0.5 w-6 flex-shrink-0">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">
                      {rec.title}
                    </h3>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${EFFORT_STYLES[rec.effort]}`}
                    >
                      {rec.effort} effort
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${IMPACT_STYLES[rec.impact]}`}
                    >
                      {rec.impact} impact
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {pillarName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{rec.description}</p>
                  {rec.reason && (
                    <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
