import type { ReportData, MaturityLevel } from "../types";
import { LEVEL_LABELS } from "../types";

interface Props {
  data: ReportData;
}

const LEVELS: MaturityLevel[] = [1, 2, 3, 4, 5];

export default function OverallProgress({ data }: Props) {
  const currentLevel = data.levelResult.level;
  const { pillarScores } = data;

  const totalPassed = pillarScores.reduce((sum, s) => sum + s.passed, 0);
  const totalCriteria = pillarScores.reduce((sum, s) => sum + s.total, 0);
  const overallPct = totalCriteria > 0 ? Math.round((totalPassed / totalCriteria) * 100) : 0;

  const { nextLevelProgress } = data.levelResult;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      {/* Overall percentage */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">Overall Score</span>
        <span className="text-sm font-semibold text-white">{overallPct}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-surface-elevated rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            overallPct >= 80
              ? "bg-pass"
              : overallPct >= 50
                ? "bg-accent"
                : "bg-fail"
          }`}
          style={{ width: `${overallPct}%` }}
        />
      </div>

      {/* Level markers */}
      <div className="flex items-center justify-between">
        {LEVELS.map((lvl) => {
          const isActive = lvl <= currentLevel;
          const isCurrent = lvl === currentLevel;
          return (
            <div key={lvl} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isCurrent
                    ? "bg-accent border-accent text-black"
                    : isActive
                      ? "bg-surface-elevated border-pass text-pass"
                      : "bg-surface-elevated border-surface-border text-gray-500"
                }`}
              >
                L{lvl}
              </div>
              <span
                className={`text-[10px] ${
                  isCurrent
                    ? "text-accent font-semibold"
                    : isActive
                      ? "text-gray-400"
                      : "text-gray-600"
                }`}
              >
                {LEVEL_LABELS[lvl]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Next level hint */}
      {nextLevelProgress.nextLevel !== null && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          {nextLevelProgress.remaining} more criteria to reach Level{" "}
          {nextLevelProgress.nextLevel}
        </p>
      )}
      {nextLevelProgress.nextLevel === null && (
        <p className="text-xs text-pass mt-3 text-center font-medium">
          Maximum level achieved!
        </p>
      )}
    </div>
  );
}
