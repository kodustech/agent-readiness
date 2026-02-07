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
        // Check all common lock/build files for freshness
        const lockFiles = [
          "package-lock.json",
          "bun.lockb",
          "yarn.lock",
          "pnpm-lock.yaml",
          "gradle.lockfile",
          "build.gradle.kts",
          "build.gradle",
          "poetry.lock",
          "Pipfile.lock",
          "go.sum",
          "Cargo.lock",
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
                message: `${lockFile} was modified ${daysAgo} day(s) ago`,
              };
            } else {
              const monthsAgo = Math.round(ageMs / (30 * 24 * 60 * 60 * 1000));
              return {
                criterionId: "no-outdated-deps",
                pass: false,
                message: `${lockFile} was last modified ~${monthsAgo} month(s) ago`,
                details:
                  "Run dependency updates regularly to avoid security vulnerabilities and incompatibilities.",
              };
            }
          }
        }

        // Check if there's any known project type at all
        const hasProjectFile = await fileExists(
          repoPath,
          "package.json",
          "build.gradle.kts",
          "build.gradle",
          "pom.xml",
          "pyproject.toml",
          "go.mod",
          "Cargo.toml",
        );
        if (!hasProjectFile) {
          return {
            criterionId: "no-outdated-deps",
            pass: true,
            message: "No recognized project manifest found; skipping dependency freshness check.",
            skipped: true,
          };
        }

        return {
          criterionId: "no-outdated-deps",
          pass: false,
          message: "Project manifest found but no lock file or recent build file detected.",
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

        // Check for detekt with UnusedPrivateMember rule (Kotlin dead code detection)
        const detektConfigFiles = ["detekt.yml", ".detekt.yml", "detekt-config.yml"];
        for (const detektFile of detektConfigFiles) {
          const detektContent = await readFileContent(repoPath, detektFile);
          if (detektContent && detektContent.includes("UnusedPrivateMember")) {
            return {
              criterionId: "dead-code-detection",
              pass: true,
              message: `detekt UnusedPrivateMember rule found in ${detektFile}`,
            };
          }
        }

        // Check build.gradle.kts or build.gradle for detekt (which has dead code rules by default)
        for (const gradleFile of ["build.gradle.kts", "build.gradle"]) {
          const gradleContent = await readFileContent(repoPath, gradleFile);
          if (gradleContent && gradleContent.includes("detekt")) {
            return {
              criterionId: "dead-code-detection",
              pass: true,
              message: `detekt configured in ${gradleFile} (includes dead code detection)`,
            };
          }
        }

        // Check for Python vulture (dead code detection)
        const pyprojectDC = await readFileContent(repoPath, "pyproject.toml");
        if (pyprojectDC && pyprojectDC.includes("vulture")) {
          return {
            criterionId: "dead-code-detection",
            pass: true,
            message: "vulture dead code detection found in pyproject.toml",
          };
        }
        const vultureConfig = await fileExists(repoPath, ".vulture_whitelist.py", "vulture_whitelist.py");
        if (vultureConfig) {
          return {
            criterionId: "dead-code-detection",
            pass: true,
            message: `vulture whitelist found: ${vultureConfig}`,
          };
        }

        // Check for Rust cargo-udeps (unused dependencies)
        const cargoTomlDC = await readFileContent(repoPath, "Cargo.toml");
        if (cargoTomlDC && cargoTomlDC.includes("cargo-udeps")) {
          return {
            criterionId: "dead-code-detection",
            pass: true,
            message: "cargo-udeps configured in Cargo.toml",
          };
        }

        // Check pom.xml for SpotBugs (Java dead code detection)
        const pomXmlDC = await readFileContent(repoPath, "pom.xml");
        if (pomXmlDC && (pomXmlDC.includes("spotbugs") || pomXmlDC.includes("findbugs"))) {
          return {
            criterionId: "dead-code-detection",
            pass: true,
            message: "SpotBugs/FindBugs found in pom.xml (includes dead code detection)",
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
