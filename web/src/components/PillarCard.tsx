import type { SerializedPillar, CriterionResult, PillarScore } from "../types";
import CriterionRow from "./CriterionRow";

interface Props {
  pillar: SerializedPillar;
  results: CriterionResult[];
  score?: PillarScore;
}

export default function PillarCard({ pillar, results, score }: Props) {
  const pct = score?.percentage ?? 0;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{pillar.icon}</span>
          <h3 className="text-sm font-semibold text-white">{pillar.name}</h3>
        </div>
        <span
          className={`text-sm font-bold ${
            pct >= 80 ? "text-pass" : pct >= 50 ? "text-accent" : "text-fail"
          }`}
        >
          {pct}%
        </span>
      </div>

      {/* Mini progress bar */}
      <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 80 ? "bg-pass" : pct >= 50 ? "bg-accent" : "bg-fail"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Pass/Total count */}
      <p className="text-xs text-gray-500 mb-2">
        {score?.passed ?? 0}/{score?.total ?? 0} passing
      </p>

      {/* Criteria list */}
      <div className="border-t border-surface-border pt-2">
        {results.map((r) => (
          <CriterionRow key={r.criterionId} result={r} />
        ))}
        {results.length === 0 && (
          <p className="text-xs text-gray-500 py-2">No results</p>
        )}
      </div>
    </div>
  );
}
