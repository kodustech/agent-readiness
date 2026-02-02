import type { ReportData } from "../types/index.js";

export interface SerializedReportData {
  repoName: string;
  repoPath: string;
  projectInfo: ReportData["projectInfo"];
  pillars: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    criteria: Array<{
      id: string;
      name: string;
      description: string;
      pillarId: string;
      level: number;
      requiresLLM: boolean;
    }>;
  }>;
  results: Record<string, ReportData["results"] extends Map<string, infer V> ? V : never>;
  levelResult: ReportData["levelResult"];
  pillarScores: ReportData["pillarScores"];
  recommendations: ReportData["recommendations"];
}

/**
 * Converts a ReportData object into a plain JSON-serializable object.
 * Strips non-serializable fields (like the `check` function on criteria)
 * and converts the `results` Map to a plain object.
 */
export function serializeReport(reportData: ReportData): SerializedReportData {
  return {
    repoName: reportData.repoName,
    repoPath: reportData.repoPath,
    projectInfo: reportData.projectInfo,
    pillars: reportData.pillars.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      criteria: p.criteria.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        pillarId: c.pillarId,
        level: c.level,
        requiresLLM: c.requiresLLM,
      })),
    })),
    results: Object.fromEntries(reportData.results),
    levelResult: reportData.levelResult,
    pillarScores: reportData.pillarScores,
    recommendations: reportData.recommendations,
  };
}
