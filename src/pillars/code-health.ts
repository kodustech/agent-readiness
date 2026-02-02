import type { Pillar } from "../types/index.js";
import {
  fileExists,
  readFileContent,
  getFileMtimeMs,
  packageJsonHas,
} from "./utils.js";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

const codeHealth: Pillar = {
  id: "code-health",
  name: "Code Health",
  description:
    "Measures ongoing code health signals such as dependency freshness, dead code detection, and bundle analysis.",
  icon: "\uD83D\uDC9A",
  criteria: [
    {
      id: "no-outdated-deps",
      name: "Dependencies recently updated",
      description:
        "If a package.json exists, the lock file was modified within the last 6 months (heuristic for freshness).",
      pillarId: "code-health",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const pkgFound = await fileExists(repoPath, "package.json");
        if (!pkgFound) {
          return {
            criterionId: "no-outdated-deps",
            pass: true,
            message: "No package.json found; skipping dependency freshness check.",
            skipped: true,
          };
        }

        // Check all common lock files
        const lockFiles = [
          "package-lock.json",
          "bun.lockb",
          "yarn.lock",
          "pnpm-lock.yaml",
        ];

        for (const lockFile of lockFiles) {
          const mtime = await getFileMtimeMs(repoPath, lockFile);
          if (mtime !== null) {
            const ageMs = Date.now() - mtime;
            if (ageMs < SIX_MONTHS_MS) {
              const daysAgo = Math.round(ageMs / (24 * 60 * 60 * 1000));
              return {
                criterionId: "no-outdated-deps",
                pass: true,
                message: `Lock file ${lockFile} was modified ${daysAgo} day(s) ago`,
              };
            } else {
              const monthsAgo = Math.round(ageMs / (30 * 24 * 60 * 60 * 1000));
              return {
                criterionId: "no-outdated-deps",
                pass: false,
                message: `Lock file ${lockFile} was last modified ~${monthsAgo} month(s) ago`,
                details:
                  "Run dependency updates regularly to avoid security vulnerabilities and incompatibilities.",
              };
            }
          }
        }

        return {
          criterionId: "no-outdated-deps",
          pass: false,
          message: "package.json found but no lock file detected.",
          details:
            "Add and commit a lock file to track dependency versions.",
        };
      },
    },
    {
      id: "dead-code-detection",
      name: "Dead code detection configured",
      description:
        "A tool for detecting dead/unused code is configured (knip, .deadcode, eslint unused-exports).",
      pillarId: "code-health",
      level: 4,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check for knip configuration
        const knipFound = await fileExists(
          repoPath,
          "knip.json",
          "knip.ts",
          "knip.config.ts",
          ".knip.json",
        );
        if (knipFound) {
          return {
            criterionId: "dead-code-detection",
            pass: true,
            message: `Dead code detection configured: ${knipFound}`,
          };
        }

        // Check for .deadcode*
        const deadcodeFound = await fileExists(repoPath, ".deadcode*");
        if (deadcodeFound) {
          return {
            criterionId: "dead-code-detection",
            pass: true,
            message: `Dead code detection configured: ${deadcodeFound}`,
          };
        }

        // Check for knip in package.json scripts
        const hasKnipScript = await packageJsonHas(repoPath, "scripts.knip");
        if (hasKnipScript) {
          return {
            criterionId: "dead-code-detection",
            pass: true,
            message: "knip script found in package.json",
          };
        }

        // Check ESLint config for unused-exports plugin
        const eslintFiles = [
          ".eslintrc",
          ".eslintrc.js",
          ".eslintrc.cjs",
          ".eslintrc.json",
          ".eslintrc.yml",
          ".eslintrc.yaml",
        ];
        for (const eslintFile of eslintFiles) {
          const content = await readFileContent(repoPath, eslintFile);
          if (content && content.includes("unused-exports")) {
            return {
              criterionId: "dead-code-detection",
              pass: true,
              message: `ESLint unused-exports plugin found in ${eslintFile}`,
            };
          }
        }

        // Check eslint.config.* for unused-exports
        const flatConfig = await fileExists(repoPath, "eslint.config.*");
        if (flatConfig) {
          const content = await readFileContent(repoPath, flatConfig);
          if (content && content.includes("unused-exports")) {
            return {
              criterionId: "dead-code-detection",
              pass: true,
              message: `ESLint unused-exports plugin found in ${flatConfig}`,
            };
          }
        }

        return {
          criterionId: "dead-code-detection",
          pass: false,
          message: "No dead code detection tool found.",
          details:
            "Add knip, deadcode detection, or eslint-plugin-unused-exports to find unused code.",
        };
      },
    },
    {
      id: "bundle-analysis",
      name: "Bundle analysis configured",
      description:
        "Bundle analysis or size limits are configured (webpack-bundle-analyzer, @next/bundle-analyzer, size-limit).",
      pillarId: "code-health",
      level: 5,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check package.json dependencies for bundle analyzers
        const pkgContent = await readFileContent(repoPath, "package.json");
        if (pkgContent) {
          try {
            const pkg = JSON.parse(pkgContent);
            const allDeps = {
              ...pkg.dependencies,
              ...pkg.devDependencies,
            };
            const bundleAnalyzers = [
              "webpack-bundle-analyzer",
              "@next/bundle-analyzer",
              "size-limit",
              "@size-limit/preset-small-lib",
              "@size-limit/preset-app",
              "bundlewatch",
              "bundlephobia",
            ];
            for (const analyzer of bundleAnalyzers) {
              if (allDeps?.[analyzer]) {
                return {
                  criterionId: "bundle-analysis",
                  pass: true,
                  message: `Bundle analyzer found in dependencies: ${analyzer}`,
                };
              }
            }
          } catch {
            // Ignore parse errors
          }
        }

        // Check for size-limit config
        const sizeLimitConfig = await fileExists(
          repoPath,
          ".size-limit.json",
          ".size-limit.js",
          ".size-limit.cjs",
        );
        if (sizeLimitConfig) {
          return {
            criterionId: "bundle-analysis",
            pass: true,
            message: `Size limit configuration found: ${sizeLimitConfig}`,
          };
        }

        // Check for size-limit in package.json
        const hasSizeLimit = await packageJsonHas(repoPath, "size-limit");
        if (hasSizeLimit) {
          return {
            criterionId: "bundle-analysis",
            pass: true,
            message: "size-limit configuration found in package.json",
          };
        }

        return {
          criterionId: "bundle-analysis",
          pass: false,
          message: "No bundle analysis configuration found.",
          details:
            "Add webpack-bundle-analyzer, @next/bundle-analyzer, or size-limit to monitor bundle size.",
        };
      },
    },
  ],
};

export default codeHealth;
