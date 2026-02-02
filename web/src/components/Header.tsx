import type { ReportData, MaturityLevel } from "../types";
import { LEVEL_LABELS } from "../types";

interface Props {
  data: ReportData;
}

const LEVEL_COLORS: Record<MaturityLevel, string> = {
  1: "bg-red-500/20 text-red-400 border-red-500/30",
  2: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  3: "bg-green-500/20 text-green-400 border-green-500/30",
  4: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  5: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function Header({ data }: Props) {
  const level = data.levelResult.level;
  const label = LEVEL_LABELS[level];
  const colorClasses = LEVEL_COLORS[level];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{data.repoName}</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-gray-400">
            {data.projectInfo.detectedTypes.join(", ") || "unknown"}
          </span>
          {data.projectInfo.isMonorepo && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              monorepo
            </span>
          )}
        </div>
      </div>
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${colorClasses}`}
      >
        <span className="text-lg font-bold">L{level}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
