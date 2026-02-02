import type {
  Pillar,
  CriterionResult,
  PillarScore,
  LevelResult,
  MaturityLevel,
} from "../types/index.js";

import { LEVEL_THRESHOLD } from "../types/index.js";

export function calculatePillarScores(
  pillars: Pillar[],
  results: Map<string, CriterionResult[]>,
): PillarScore[] {
  return pillars.map((pillar) => {
    const pillarResults = results.get(pillar.id) ?? [];

    // Exclude skipped criteria
    const counted = pillarResults.filter((r) => !r.skipped);
    const passed = counted.filter((r) => r.pass).length;
    const total = counted.length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

    return {
      pillarId: pillar.id,
      passed,
      total,
      percentage,
    };
  });
}

export function calculateLevel(
  pillars: Pillar[],
  results: Map<string, CriterionResult[]>,
): LevelResult {
  // Collect ALL criteria results across all pillars, excluding skipped
  const allCriteria: { level: MaturityLevel; pass: boolean }[] = [];

  for (const pillar of pillars) {
    const pillarResults = results.get(pillar.id) ?? [];

    for (const criterion of pillar.criteria) {
      const result = pillarResults.find(
        (r) => r.criterionId === criterion.id,
      );

      // Skip criteria that were skipped (e.g. LLM-required without --ai)
      if (result?.skipped) continue;

      allCriteria.push({
        level: criterion.level,
        pass: result?.pass ?? false,
      });
    }
  }

  // Group criteria by their assigned level (1-5)
  const levels: MaturityLevel[] = [1, 2, 3, 4, 5];
  const byLevel = new Map<MaturityLevel, { pass: boolean }[]>();

  for (const lvl of levels) {
    byLevel.set(
      lvl,
      allCriteria.filter((c) => c.level === lvl),
    );
  }

  // Determine the highest passed level
  // A level passes if >= 80% of its criteria pass
  // Levels are sequential: can't pass level N without passing N-1
  let highestPassed: MaturityLevel = 1;
  let lastPassedLevel: MaturityLevel = 1;

  for (const lvl of levels) {
    const criteriaAtLevel = byLevel.get(lvl)!;

    if (criteriaAtLevel.length === 0) {
      // If no criteria at this level, consider it passed (vacuous truth)
      lastPassedLevel = lvl;
      highestPassed = lvl;
      continue;
    }

    const passedCount = criteriaAtLevel.filter((c) => c.pass).length;
    const passRate = passedCount / criteriaAtLevel.length;

    if (passRate >= LEVEL_THRESHOLD) {
      lastPassedLevel = lvl;
      highestPassed = lvl;
    } else {
      // Sequential requirement: can't pass level N without N-1
      break;
    }
  }

  // Calculate next level progress
  const nextLevel: MaturityLevel | null =
    highestPassed < 5 ? ((highestPassed + 1) as MaturityLevel) : null;

  let current = 0;
  let needed = 0;
  let remaining = 0;

  if (nextLevel !== null) {
    const nextLevelCriteria = byLevel.get(nextLevel)!;
    const totalAtNext = nextLevelCriteria.length;
    current = nextLevelCriteria.filter((c) => c.pass).length;
    needed = Math.ceil(totalAtNext * LEVEL_THRESHOLD);
    remaining = Math.max(0, needed - current);
  }

  return {
    level: highestPassed,
    nextLevelProgress: {
      current,
      needed,
      remaining,
      nextLevel,
    },
  };
}
