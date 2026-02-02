export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

export const LEVEL_LABELS: Record<MaturityLevel, string> = {
  1: "Foundational",
  2: "Guided",
  3: "Structured",
  4: "Optimized",
  5: "Autonomous",
};

export interface ProjectInfo {
  detectedTypes: string[];
  isMonorepo: boolean;
  packages: string[];
}

export interface CriterionResult {
  criterionId: string;
  pass: boolean;
  message: string;
  details?: string;
  skipped?: boolean;
}

export interface SerializedCriterion {
  id: string;
  name: string;
  description: string;
  pillarId: string;
  level: number;
  requiresLLM: boolean;
}

export interface SerializedPillar {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: SerializedCriterion[];
}

export interface PillarScore {
  pillarId: string;
  passed: number;
  total: number;
  percentage: number;
}

export interface LevelResult {
  level: MaturityLevel;
  nextLevelProgress: {
    current: number;
    needed: number;
    remaining: number;
    nextLevel: MaturityLevel | null;
  };
}

export interface Recommendation {
  title: string;
  description: string;
  reason: string;
  effort: "low" | "medium" | "high";
  impact: "high" | "medium" | "low";
  pillarId: string;
  criterionId: string;
}

export interface ReportData {
  repoName: string;
  repoPath: string;
  projectInfo: ProjectInfo;
  pillars: SerializedPillar[];
  results: Record<string, CriterionResult[]>;
  levelResult: LevelResult;
  pillarScores: PillarScore[];
  recommendations: Recommendation[];
}

declare global {
  interface Window {
    __KODUS_REPORT_DATA__?: ReportData;
  }
}
