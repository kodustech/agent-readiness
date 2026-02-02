export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

export const LEVEL_LABELS: Record<MaturityLevel, string> = {
  1: "Foundational",
  2: "Guided",
  3: "Structured",
  4: "Optimized",
  5: "Autonomous",
};

export const LEVEL_THRESHOLD = 0.8;

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

export type CriterionCheckFn = (
  repoPath: string,
  projectInfo: ProjectInfo,
  llmClient?: LLMClient,
) => Promise<CriterionResult>;

export interface Criterion {
  id: string;
  name: string;
  description: string;
  pillarId: string;
  level: MaturityLevel;
  requiresLLM: boolean;
  check: CriterionCheckFn;
}

export interface Pillar {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: Criterion[];
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
  pillars: Pillar[];
  results: Map<string, CriterionResult[]>;
  levelResult: LevelResult;
  pillarScores: PillarScore[];
  recommendations: Recommendation[];
}

export interface Config {
  pillars?: Record<string, boolean>;
  criteria?: Record<string, boolean>;
  thresholds?: Record<string, number>;
  aiEnabled?: boolean;
  apiKey?: string;
  apiBaseUrl?: string;
}

export interface CLIOptions {
  path: string;
  ai: boolean;
  apiKey?: string;
  ci: boolean;
  format: "text" | "json";
  minLevel?: number;
  noColor: boolean;
  init: boolean;
  web: boolean;
}

export interface RenderOptions {
  noColor: boolean;
  ci: boolean;
}

export interface LLMClient {
  evaluate(prompt: string, context: string): Promise<{ pass: boolean; message: string; details?: string }>;
}
