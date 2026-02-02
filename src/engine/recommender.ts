import type {
  Pillar,
  CriterionResult,
  PillarScore,
  LevelResult,
  Recommendation,
  MaturityLevel,
} from "../types/index.js";

// ---------------------------------------------------------------------------
// Actionable description + reason mapping keyed by criterion ID
// ---------------------------------------------------------------------------

const CRITERION_INFO: Record<
  string,
  { description: string; reason: string }
> = {
  // Style & Linting
  linter: {
    description:
      "Add a linter like ESLint or Biome to enforce code style and catch common mistakes",
    reason:
      "Linters give agents instant feedback on style issues, preventing CI failures and reducing review churn",
  },
  formatter: {
    description:
      "Configure an auto-formatter such as Prettier or Biome so code style is applied automatically",
    reason:
      "Auto-formatting removes style debates and lets agents produce consistently formatted code without guesswork",
  },
  "type-checker": {
    description:
      "Enable strict type checking (e.g. strict mode in tsconfig.json, mypy, or pyright)",
    reason:
      "Strict types help agents catch errors at compile time instead of at runtime, dramatically improving code reliability",
  },
  "pre-commit-hooks": {
    description:
      "Set up pre-commit hooks with Husky, Lefthook, or pre-commit to run checks before every commit",
    reason:
      "Pre-commit hooks provide a fast feedback loop so agents discover issues before pushing code",
  },
  editorconfig: {
    description:
      "Create an .editorconfig file to standardize indentation, line endings, and charset across editors",
    reason:
      "EditorConfig ensures agents produce files with correct whitespace and encoding regardless of tooling",
  },

  // Testing
  "test-framework": {
    description:
      "Configure a test framework such as Jest, Vitest, pytest, or Go testing with a config file",
    reason:
      "A configured test framework lets agents write and run tests to verify their changes automatically",
  },
  "test-files": {
    description:
      "Add test files alongside source code following standard naming conventions (*.test.*, *.spec.*, etc.)",
    reason:
      "Existing tests give agents examples to follow and a safety net to validate new code against",
  },
  "test-script": {
    description:
      "Define a 'test' script in package.json or a test target in a Makefile so tests can be run with a single command",
    reason:
      "A standard test command allows agents to verify changes without guessing how to run the test suite",
  },
  coverage: {
    description:
      "Set up code coverage reporting in your test framework configuration",
    reason:
      "Coverage metrics help agents understand which parts of the codebase are well-tested and which need attention",
  },
  "e2e-tests": {
    description:
      "Add end-to-end or integration tests using Playwright, Cypress, or a similar framework",
    reason:
      "E2E tests give agents confidence that the whole application works correctly after changes, not just individual units",
  },

  // Documentation
  readme: {
    description:
      "Create a comprehensive README.md with project overview, setup instructions, and usage examples",
    reason:
      "A good README helps agents understand the project context, conventions, and how to get started quickly",
  },
  contributing: {
    description:
      "Add a CONTRIBUTING.md with development workflow, coding standards, and PR guidelines",
    reason:
      "Contributing guidelines teach agents the team's workflow so their PRs match expectations from the start",
  },
  "api-docs": {
    description:
      "Add API documentation using OpenAPI/Swagger specs, JSDoc, TypeDoc, or a dedicated docs folder",
    reason:
      "API docs let agents understand available endpoints, data shapes, and contracts without reading every source file",
  },
  codeowners: {
    description:
      "Create a CODEOWNERS file to define ownership for different parts of the codebase",
    reason:
      "CODEOWNERS helps agents understand who to tag for reviews and which areas have strict oversight",
  },
  "ai-context": {
    description:
      "Add AI context files such as CLAUDE.md, .cursorrules, or .github/copilot-instructions.md with project-specific guidance",
    reason:
      "AI context files give agents tailored instructions about architecture decisions, patterns to follow, and pitfalls to avoid",
  },
  "architecture-docs": {
    description:
      "Create architecture documentation (ARCHITECTURE.md or docs/adr/) describing system design and decisions",
    reason:
      "Architecture docs help agents make design choices consistent with the existing system instead of guessing",
  },

  // Dev Environment
  "lock-file": {
    description:
      "Commit a dependency lock file (package-lock.json, bun.lockb, yarn.lock, poetry.lock, etc.)",
    reason:
      "Lock files ensure agents install the exact same dependency versions, preventing 'works on my machine' issues",
  },
  containerization: {
    description:
      "Add a Dockerfile, docker-compose.yml, or .devcontainer configuration for reproducible environments",
    reason:
      "Containerization gives agents a fully reproducible environment, eliminating setup discrepancies",
  },
  "env-docs": {
    description:
      "Create a .env.example or .env.template documenting all required environment variables",
    reason:
      "Environment variable documentation lets agents understand required configuration without accessing secrets",
  },
  "setup-script": {
    description:
      "Add a setup script (Makefile, scripts/setup.sh, or npm run setup) to automate development environment setup",
    reason:
      "A one-command setup lets agents bootstrap the project quickly and correctly every time",
  },
  "version-pinned": {
    description:
      "Pin the runtime version with .nvmrc, .node-version, .python-version, .tool-versions, or .mise.toml",
    reason:
      "Pinned runtime versions prevent agents from hitting version incompatibilities during execution",
  },

  // CI/CD
  "ci-config": {
    description:
      "Set up a CI pipeline configuration (GitHub Actions, GitLab CI, CircleCI, or similar)",
    reason:
      "CI pipelines give agents automated feedback on whether their changes pass all quality gates",
  },
  "ci-tests": {
    description:
      "Ensure your CI pipeline runs the test suite on every push and pull request",
    reason:
      "Running tests in CI means agents get immediate feedback if their changes break existing functionality",
  },
  "ci-linters": {
    description:
      "Add linting and formatting checks to your CI pipeline",
    reason:
      "CI lint checks catch style issues agents may miss locally, keeping the codebase consistent",
  },
  "build-step": {
    description:
      "Add an automated build step to your CI pipeline or package.json scripts",
    reason:
      "An automated build step verifies that agents' changes compile and bundle correctly before merging",
  },
  "deploy-pipeline": {
    description:
      "Configure a deploy pipeline or stage in your CI/CD system for automated deployments",
    reason:
      "Automated deployments let agents' changes reach production safely through a controlled pipeline",
  },
  "branch-protection": {
    description:
      "Document or configure branch protection rules requiring reviews and passing checks before merging",
    reason:
      "Branch protection ensures agents' PRs go through proper review and validation before reaching main",
  },

  // Code Health
  "outdated-deps": {
    description:
      "Update critically outdated dependencies to their latest stable versions",
    reason:
      "Current dependencies reduce compatibility issues agents encounter and ensure security patches are applied",
  },
  "dead-code": {
    description:
      "Configure dead code detection using Knip, ts-unused-exports, or a similar tool",
    reason:
      "Dead code detection helps agents avoid modifying unused code and keeps the codebase lean",
  },
  "bundle-analysis": {
    description:
      "Set up bundle analysis with webpack-bundle-analyzer, @next/bundle-analyzer, or a similar tool",
    reason:
      "Bundle analysis helps agents understand the impact of adding dependencies on application size",
  },

  // Security
  "security-scanning": {
    description:
      "Configure security scanning with CodeQL, Snyk, Trivy, or Semgrep in your CI pipeline",
    reason:
      "Security scanning catches vulnerabilities agents might introduce before they reach production",
  },
  "secrets-detection": {
    description:
      "Set up secrets detection using Gitleaks, detect-secrets, or GitGuardian",
    reason:
      "Secrets detection prevents agents from accidentally committing API keys, tokens, or credentials",
  },
  license: {
    description:
      "Add a LICENSE file specifying the project's open-source or proprietary license",
    reason:
      "A clear license file helps agents understand what code and dependencies they can use",
  },
  "security-policy": {
    description:
      "Create a SECURITY.md file describing how to report vulnerabilities",
    reason:
      "A security policy gives agents guidance on handling security-sensitive changes appropriately",
  },
  "dep-updates": {
    description:
      "Configure automated dependency updates with Dependabot or Renovate",
    reason:
      "Automated dependency updates keep the project current so agents work with well-maintained libraries",
  },

  // LLM-powered criteria
  "readme-quality": {
    description:
      "Improve your README content: add clear sections for installation, usage, architecture, and contributing",
    reason:
      "A high-quality README gives agents rich context about the project beyond just file presence",
  },
  "docs-agent-friendliness": {
    description:
      "Improve documentation to be more AI-agent-friendly: explain project structure, coding conventions, and testing patterns",
    reason:
      "Agent-friendly docs help autonomous coding agents make correct changes without constant human guidance",
  },
  "test-quality": {
    description:
      "Improve test quality: add descriptive names, cover edge cases, and test behavior rather than implementation",
    reason:
      "High-quality tests give agents confidence that their changes work correctly and don't break existing behavior",
  },
  "naming-conventions": {
    description:
      "Establish and document consistent naming conventions for files, functions, and variables",
    reason:
      "Consistent naming lets agents predict correct patterns when writing new code, reducing review friction",
  },
  "inline-docs-quality": {
    description:
      "Add meaningful inline documentation and comments to key modules and public APIs",
    reason:
      "Inline docs help agents understand intent and edge cases when modifying complex logic",
  },
  "code-structure": {
    description:
      "Organize code into a consistent folder structure with clear naming conventions",
    reason:
      "Consistent structure lets agents predict where to find and place code without trial and error",
  },
  "file-size": {
    description:
      "Break down large files and functions into smaller, focused modules",
    reason:
      "Smaller files are easier for agents to understand, modify, and test without unintended side effects",
  },
};

// ---------------------------------------------------------------------------
// Effort estimate mapping keyed by criterion ID
// ---------------------------------------------------------------------------

const EFFORT_MAP: Record<string, Recommendation["effort"]> = {
  // File creation = low
  editorconfig: "low",
  license: "low",
  readme: "low",
  contributing: "low",
  codeowners: "low",
  "security-policy": "low",
  "ai-context": "low",
  "env-docs": "low",
  "lock-file": "low",
  "version-pinned": "low",

  // Config setup = medium
  linter: "medium",
  formatter: "medium",
  "type-checker": "medium",
  "pre-commit-hooks": "medium",
  "test-framework": "medium",
  "test-files": "medium",
  "test-script": "medium",
  "ci-config": "medium",
  "ci-tests": "medium",
  "ci-linters": "medium",
  "build-step": "medium",
  "setup-script": "medium",
  "api-docs": "medium",
  "dead-code": "medium",
  "secrets-detection": "medium",
  "dep-updates": "medium",
  "branch-protection": "medium",
  "outdated-deps": "medium",

  // Comprehensive setup = high
  "e2e-tests": "high",
  coverage: "high",
  containerization: "high",
  "deploy-pipeline": "high",
  "security-scanning": "high",
  "architecture-docs": "high",
  "bundle-analysis": "high",
  "readme-quality": "high",
  "docs-agent-friendliness": "high",
  "test-quality": "high",
  "naming-conventions": "medium",
  "inline-docs-quality": "high",
  "code-structure": "high",
  "file-size": "high",
};

// ---------------------------------------------------------------------------
// Impact helpers
// ---------------------------------------------------------------------------

const IMPACT_ORDER: Record<Recommendation["impact"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const EFFORT_ORDER: Record<Recommendation["effort"], number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function determineImpact(
  criterionLevel: MaturityLevel,
  currentLevel: MaturityLevel,
): Recommendation["impact"] {
  const nextLevel = currentLevel + 1;
  if (criterionLevel === nextLevel) return "high";
  if (criterionLevel === currentLevel + 2) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateRecommendations(
  pillars: Pillar[],
  results: Map<string, CriterionResult[]>,
  _pillarScores: PillarScore[],
  levelResult: LevelResult,
): Recommendation[] {
  const currentLevel = levelResult.level;

  // 1. Collect all failed (non-skipped) criteria across all pillars
  const failedItems: {
    pillarId: string;
    criterionId: string;
    criterionName: string;
    criterionLevel: MaturityLevel;
  }[] = [];

  for (const pillar of pillars) {
    const pillarResults = results.get(pillar.id) ?? [];

    for (const criterion of pillar.criteria) {
      const result = pillarResults.find(
        (r) => r.criterionId === criterion.id,
      );

      // Only consider criteria that explicitly failed (not skipped)
      if (result && !result.pass && !result.skipped) {
        failedItems.push({
          pillarId: pillar.id,
          criterionId: criterion.id,
          criterionName: criterion.name,
          criterionLevel: criterion.level,
        });
      }
    }
  }

  // 2. Build a Recommendation for each failed criterion
  const recommendations: Recommendation[] = failedItems.map((item) => {
    const info = CRITERION_INFO[item.criterionId];
    const effort = EFFORT_MAP[item.criterionId] ?? "medium";
    const impact = determineImpact(item.criterionLevel, currentLevel);

    return {
      title: item.criterionName,
      description:
        info?.description ??
        `Address the failing "${item.criterionId}" criterion to improve agent readiness`,
      reason:
        info?.reason ??
        "Meeting this criterion improves the codebase's readiness for autonomous AI agents",
      effort,
      impact,
      pillarId: item.pillarId,
      criterionId: item.criterionId,
    };
  });

  // 3. Sort: next-level first, then impact (high > medium > low), then effort (low > medium > high)
  const nextLevel = currentLevel + 1;

  recommendations.sort((a, b) => {
    const aFailed = failedItems.find(
      (f) => f.criterionId === a.criterionId && f.pillarId === a.pillarId,
    )!;
    const bFailed = failedItems.find(
      (f) => f.criterionId === b.criterionId && f.pillarId === b.pillarId,
    )!;

    // Criteria at the next reachable level come first
    const aIsNext = aFailed.criterionLevel === nextLevel ? 0 : 1;
    const bIsNext = bFailed.criterionLevel === nextLevel ? 0 : 1;
    if (aIsNext !== bIsNext) return aIsNext - bIsNext;

    // Then sort by impact (high > medium > low)
    const impactDiff = IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact];
    if (impactDiff !== 0) return impactDiff;

    // Then sort by effort (low > medium > high)
    return EFFORT_ORDER[a.effort] - EFFORT_ORDER[b.effort];
  });

  // 4. Return at most 10 recommendations
  return recommendations.slice(0, 10);
}
