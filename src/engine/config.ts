import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import type { Config } from "../types/index.js";

const CONFIG_FILENAMES = [".kodus-readiness.yml", ".kodus-readiness.yaml"];

/**
 * Loads a Kodus Readiness configuration file from the given repository path.
 *
 * Searches for `.kodus-readiness.yml` or `.kodus-readiness.yaml` in the root
 * of `repoPath`. If found, parses the YAML content and returns the resulting
 * Config object. If no config file exists, returns an empty object so callers
 * can safely fall back to defaults. Parse errors are logged as warnings and
 * also result in an empty object.
 */
export async function loadConfig(repoPath: string): Promise<Config> {
  for (const filename of CONFIG_FILENAMES) {
    const filePath = path.join(repoPath, filename);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = YAML.parse(content) as Config | null;
      return parsed ?? {};
    } catch (err: unknown) {
      // If the file simply does not exist, try the next candidate.
      if (isNodeError(err) && err.code === "ENOENT") {
        continue;
      }

      // Any other error (permissions, YAML syntax, etc.) — warn and bail.
      console.warn(
        `Warning: failed to parse config file "${filePath}": ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {};
    }
  }

  // No config file found — perfectly fine.
  return {};
}

/**
 * Returns a well-documented YAML template that users can save as
 * `.kodus-readiness.yml` in their repository root.
 */
export function generateDefaultConfig(): string {
  return `# ──────────────────────────────────────────────────────────────
# Kodus Agent-Readiness configuration
# Place this file at the root of your repository as
#   .kodus-readiness.yml   or   .kodus-readiness.yaml
# ──────────────────────────────────────────────────────────────

# ── Pillars ──────────────────────────────────────────────────
# Toggle entire assessment pillars on or off.
# Set a pillar to false to skip all of its criteria.
# All pillars are enabled by default.
pillars:
  style-linting: true
  testing: true
  documentation: true
  dev-environment: true
  ci-cd: true
  code-health: true
  security: true

# ── Criteria ─────────────────────────────────────────────────
# Fine-grained toggles for individual criteria within pillars.
# Set a criterion to false to skip it during assessment.
# All criteria are enabled by default.
criteria:
  # Style & Linting
  linter: true
  formatter: true
  type-checker: true
  pre-commit-hooks: true
  editorconfig: true

  # Testing
  test-framework: true
  test-files-exist: true
  test-script: true
  coverage-config: true
  e2e-tests: true

  # Documentation
  readme: true
  contributing: true
  api-docs: true
  codeowners: true
  ai-context: true
  architecture-docs: true

  # Dev Environment
  lock-file: true
  containerization: true
  env-documentation: true
  setup-script: true
  version-pinned: true

  # CI / CD
  ci-config: true
  ci-runs-tests: true
  ci-runs-linters: true
  build-automated: true
  deploy-pipeline: true
  branch-protection: true

  # Code Health
  no-outdated-deps: true
  dead-code-detection: true
  bundle-analysis: true

  # Security
  license: true
  security-scanning: true
  secrets-detection: true
  security-policy: true
  dep-update-automation: true

# ── Thresholds ───────────────────────────────────────────────
# Override the scoring thresholds used when computing maturity
# levels. Values are expressed as decimals between 0 and 1.
thresholds:
  # Minimum percentage of criteria that must pass to reach a level
  # level-pass: 0.8

# ── AI Settings ──────────────────────────────────────────────
# When AI is enabled, some criteria use an LLM to perform deeper
# analysis (e.g. reviewing documentation quality).
# aiEnabled: false
# apiKey: ""           # Or set KODUS_API_KEY env variable
# apiBaseUrl: ""       # Custom endpoint for the LLM API
`;
}

// ── Helpers ──────────────────────────────────────────────────

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
