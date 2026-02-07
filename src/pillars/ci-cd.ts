import type { Pillar } from "../types/index.js";
import {
  fileExists,
  readFileContent,
  packageJsonHas,
} from "./utils.js";
import fg from "fast-glob";

async function getCIConfigContents(
  repoPath: string,
): Promise<{ file: string; content: string }[]> {
  const results: { file: string; content: string }[] = [];

  const ciFiles = await fg(
    [
      ".github/workflows/*.yml",
      ".github/workflows/*.yaml",
      ".gitlab-ci.yml",
      ".circleci/config.yml",
      "Jenkinsfile",
      ".travis.yml",
    ],
    { cwd: repoPath, absolute: false, dot: true },
  );

  for (const file of ciFiles) {
    const content = await readFileContent(repoPath, file);
    if (content) {
      results.push({ file, content });
    }
  }

  return results;
}

const ciCd: Pillar = {
  id: "ci-cd",
  name: "CI/CD",
  description:
    "Verifies that continuous integration and delivery pipelines are in place and comprehensive.",
  icon: "\u2699\uFE0F",
  criteria: [
    {
      id: "ci-config",
      name: "CI configuration present",
      description:
        "A CI configuration file exists (GitHub Actions, GitLab CI, CircleCI, Jenkins, Travis).",
      pillarId: "ci-cd",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          ".github/workflows/*.yml",
          ".github/workflows/*.yaml",
          ".gitlab-ci.yml",
          ".circleci/config.yml",
          "Jenkinsfile",
          ".travis.yml",
        );
        if (found) {
          return {
            criterionId: "ci-config",
            pass: true,
            message: `CI configuration found: ${found}`,
          };
        }
        return {
          criterionId: "ci-config",
          pass: false,
          message: "No CI configuration found.",
          details:
            "Add a CI pipeline using GitHub Actions, GitLab CI, CircleCI, or similar.",
        };
      },
    },
    {
      id: "ci-runs-tests",
      name: "CI runs tests",
      description:
        "The CI pipeline runs tests (jest, vitest, pytest, go test, or generic test commands).",
      pillarId: "ci-cd",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const configs = await getCIConfigContents(repoPath);
        if (configs.length === 0) {
          return {
            criterionId: "ci-runs-tests",
            pass: false,
            message: "No CI configuration found to check for test execution.",
          };
        }

        const testPatterns =
          /\b(npm\s+test|yarn\s+test|pnpm\s+test|bun\s+test|jest|vitest|pytest|go\s+test|make\s+test|npm\s+run\s+test|gradle\s+test|\.\/gradlew\s+test|gradlew\s+test|gradle\s+check|\.\/gradlew\s+check|mvn\s+test|\.\/mvnw\s+test|mvn\s+verify|\.\/mvnw\s+verify|cargo\s+test)\b/i;

        for (const { file, content } of configs) {
          if (testPatterns.test(content)) {
            return {
              criterionId: "ci-runs-tests",
              pass: true,
              message: `CI runs tests in ${file}`,
            };
          }
        }

        return {
          criterionId: "ci-runs-tests",
          pass: false,
          message: "CI configuration found but no test execution detected.",
          details:
            "Add a test step to your CI pipeline to run tests automatically.",
        };
      },
    },
    {
      id: "ci-runs-linters",
      name: "CI runs linters",
      description:
        "The CI pipeline runs linting (eslint, biome, ruff, golangci-lint, or generic lint commands).",
      pillarId: "ci-cd",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const configs = await getCIConfigContents(repoPath);
        if (configs.length === 0) {
          return {
            criterionId: "ci-runs-linters",
            pass: false,
            message: "No CI configuration found to check for linter execution.",
          };
        }

        const lintPatterns =
          /\b(npm\s+run\s+lint|yarn\s+lint|pnpm\s+lint|bun\s+run\s+lint|eslint|biome\s+check|biome\s+lint|ruff\s+check|ruff\s+lint|golangci-lint|make\s+lint|gradle\s+ktlintCheck|\.\/gradlew\s+ktlintCheck|gradle\s+detekt|\.\/gradlew\s+detekt|gradle\s+ktfmtCheck|\.\/gradlew\s+ktfmtCheck|\.\/gradlew\s+spotlessCheck|gradle\s+spotlessCheck|mvn\s+checkstyle|\.\/mvnw\s+checkstyle|mvn\s+pmd|cargo\s+clippy|cargo\s+fmt\s+--check)\b/i;

        for (const { file, content } of configs) {
          if (lintPatterns.test(content)) {
            return {
              criterionId: "ci-runs-linters",
              pass: true,
              message: `CI runs linters in ${file}`,
            };
          }
        }

        return {
          criterionId: "ci-runs-linters",
          pass: false,
          message: "CI configuration found but no linter execution detected.",
          details:
            "Add a lint step to your CI pipeline to enforce code quality.",
        };
      },
    },
    {
      id: "build-automated",
      name: "Build automated",
      description:
        "The build process is automated via a script or CI step.",
      pillarId: "ci-cd",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check package.json for build script
        const hasBuildScript = await packageJsonHas(
          repoPath,
          "scripts.build",
        );
        if (hasBuildScript) {
          return {
            criterionId: "build-automated",
            pass: true,
            message: '"build" script found in package.json',
          };
        }

        // Check CI configs for build commands
        const configs = await getCIConfigContents(repoPath);
        const buildPatterns =
          /\b(npm\s+run\s+build|yarn\s+build|pnpm\s+build|bun\s+run\s+build|make\s+build|go\s+build|cargo\s+build|docker\s+build|gradle\s+build|\.\/gradlew\s+build|gradle\s+assemble|\.\/gradlew\s+assemble|mvn\s+package|mvn\s+install|\.\/mvnw\s+package|\.\/mvnw\s+install|mvn\s+compile|python\s+-m\s+build|poetry\s+build)\b/i;

        for (const { file, content } of configs) {
          if (buildPatterns.test(content)) {
            return {
              criterionId: "build-automated",
              pass: true,
              message: `Build step found in CI: ${file}`,
            };
          }
        }

        // Check Makefile for build target
        const makefile = await readFileContent(repoPath, "Makefile");
        if (makefile && /^build\s*:/m.test(makefile)) {
          return {
            criterionId: "build-automated",
            pass: true,
            message: '"build" target found in Makefile',
          };
        }

        return {
          criterionId: "build-automated",
          pass: false,
          message: "No automated build process found.",
          details:
            'Add a "build" script in package.json or a build step in your CI pipeline.',
        };
      },
    },
    {
      id: "deploy-pipeline",
      name: "Deploy pipeline",
      description:
        "A deployment pipeline or stage is configured in CI or as a dedicated deploy config.",
      pillarId: "ci-cd",
      level: 4,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const configs = await getCIConfigContents(repoPath);
        const deployPatterns =
          /\b(deploy|deployment|publish|release|cd\s*:)\b/i;

        for (const { file, content } of configs) {
          if (deployPatterns.test(content)) {
            return {
              criterionId: "deploy-pipeline",
              pass: true,
              message: `Deploy stage found in ${file}`,
            };
          }
        }

        // Check for dedicated deploy configs
        const deployConfig = await fileExists(
          repoPath,
          "vercel.json",
          "netlify.toml",
          "fly.toml",
          "railway.json",
          "render.yaml",
          "app.yaml",
          "serverless.yml",
          "serverless.yaml",
          "terraform",
          "pulumi",
        );
        if (deployConfig) {
          return {
            criterionId: "deploy-pipeline",
            pass: true,
            message: `Deploy configuration found: ${deployConfig}`,
          };
        }

        return {
          criterionId: "deploy-pipeline",
          pass: false,
          message: "No deploy pipeline found.",
          details:
            "Add a deploy stage to your CI or configure a deployment platform.",
        };
      },
    },
    {
      id: "branch-protection",
      name: "Branch protection awareness",
      description:
        "Branch protection rules are mentioned in docs or configured via .github settings.",
      pillarId: "ci-cd",
      level: 4,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check for branch protection in .github settings
        const branchProtectionFile = await fileExists(
          repoPath,
          ".github/branch-protection*",
          ".github/settings.yml",
          ".github/settings.yaml",
        );
        if (branchProtectionFile) {
          const content = await readFileContent(
            repoPath,
            branchProtectionFile,
          );
          if (content && /branch.?protection|protected.?branch/i.test(content)) {
            return {
              criterionId: "branch-protection",
              pass: true,
              message: `Branch protection configuration found in ${branchProtectionFile}`,
            };
          }
        }

        // Check CONTRIBUTING.md for branch protection mentions
        const contributing = await readFileContent(
          repoPath,
          "CONTRIBUTING.md",
        );
        if (
          contributing &&
          /branch.?protection|protected.?branch|required.?review/i.test(
            contributing,
          )
        ) {
          return {
            criterionId: "branch-protection",
            pass: true,
            message: "Branch protection mentioned in CONTRIBUTING.md",
          };
        }

        // Check for .github/settings.yml with branches config
        const settingsContent = await readFileContent(
          repoPath,
          ".github/settings.yml",
        );
        if (settingsContent && /branches:/i.test(settingsContent)) {
          return {
            criterionId: "branch-protection",
            pass: true,
            message: "Branch configuration found in .github/settings.yml",
          };
        }

        return {
          criterionId: "branch-protection",
          pass: false,
          message: "No branch protection rules documented or configured.",
          details:
            "Document branch protection rules in CONTRIBUTING.md or configure via .github/settings.yml.",
        };
      },
    },
  ],
};

export default ciCd;
