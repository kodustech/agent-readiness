import type {
  Pillar,
  ProjectInfo,
  CriterionResult,
  LLMClient,
} from "../types/index.js";

export type OnPillarStart = (pillar: Pillar) => void;
export type OnPillarComplete = (
  pillar: Pillar,
  results: CriterionResult[],
) => void;

export interface AnalysisEngineOptions {
  aiEnabled?: boolean;
  llmClient?: LLMClient;
  onPillarStart?: OnPillarStart;
  onPillarComplete?: OnPillarComplete;
}

export class AnalysisEngine {
  private pillars: Pillar[];
  private repoPath: string;
  private projectInfo: ProjectInfo;
  private aiEnabled: boolean;
  private llmClient?: LLMClient;
  private onPillarStart?: OnPillarStart;
  private onPillarComplete?: OnPillarComplete;

  constructor(
    pillars: Pillar[],
    repoPath: string,
    projectInfo: ProjectInfo,
    options?: AnalysisEngineOptions,
  ) {
    this.pillars = pillars;
    this.repoPath = repoPath;
    this.projectInfo = projectInfo;
    this.aiEnabled = options?.aiEnabled ?? false;
    this.llmClient = options?.llmClient;
    this.onPillarStart = options?.onPillarStart;
    this.onPillarComplete = options?.onPillarComplete;
  }

  async run(): Promise<Map<string, CriterionResult[]>> {
    const allResults = new Map<string, CriterionResult[]>();

    // Run pillars sequentially so we can report progress per pillar
    for (const pillar of this.pillars) {
      this.onPillarStart?.(pillar);

      // Run criteria within a pillar concurrently
      const criteriaResults = await Promise.all(
        pillar.criteria.map((criterion) => this.runCriterion(criterion)),
      );

      allResults.set(pillar.id, criteriaResults);
      this.onPillarComplete?.(pillar, criteriaResults);
    }

    return allResults;
  }

  private async runCriterion(
    criterion: Pillar["criteria"][number],
  ): Promise<CriterionResult> {
    // Skip LLM-required criteria when AI is not enabled
    if (criterion.requiresLLM && !this.aiEnabled) {
      return {
        criterionId: criterion.id,
        pass: false,
        message: "Requires --ai flag",
        skipped: true,
      };
    }

    try {
      return await criterion.check(
        this.repoPath,
        this.projectInfo,
        this.llmClient,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        criterionId: criterion.id,
        pass: false,
        message: `Check failed: ${errorMessage}`,
      };
    }
  }
}
