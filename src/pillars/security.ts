import type { Pillar } from "../types/index.js";
import { fileExists, readFileContent } from "./utils.js";
import fg from "fast-glob";

const security: Pillar = {
  id: "security",
  name: "Security",
  description:
    "Evaluates the project's security posture including licensing, vulnerability scanning, and secret detection.",
  icon: "\uD83D\uDD12",
  criteria: [
    {
      id: "license",
      name: "License file present",
      description:
        "A LICENSE file exists in the repository root.",
      pillarId: "security",
      level: 1,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "LICENSE",
          "LICENSE.md",
          "LICENSE.txt",
          "LICENCE",
          "LICENCE.md",
          "LICENCE.txt",
        );
        if (found) {
          return {
            criterionId: "license",
            pass: true,
            message: `License file found: ${found}`,
          };
        }
        return {
          criterionId: "license",
          pass: false,
          message: "No license file found.",
          details:
            "Add a LICENSE file to clarify how the code can be used and distributed.",
        };
      },
    },
    {
      id: "security-scanning",
      name: "Security scanning in CI",
      description:
        "CI workflows include security scanning tools (CodeQL, Snyk, Trivy, Semgrep).",
      pillarId: "security",
      level: 4,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check CI workflows for security scanning tools
        const ciFiles = await fg(
          [".github/workflows/*.yml", ".github/workflows/*.yaml"],
          { cwd: repoPath, absolute: false, dot: true },
        );

        const scanPatterns =
          /\b(codeql|snyk|trivy|semgrep|sonarqube|sonarcloud|dependabot|security[_-]scan|sast)\b/i;

        for (const ciFile of ciFiles) {
          const content = await readFileContent(repoPath, ciFile);
          if (content && scanPatterns.test(content)) {
            return {
              criterionId: "security-scanning",
              pass: true,
              message: `Security scanning found in CI: ${ciFile}`,
            };
          }
        }

        // Check for Snyk config
        const snykConfig = await fileExists(repoPath, ".snyk");
        if (snykConfig) {
          return {
            criterionId: "security-scanning",
            pass: true,
            message: "Snyk configuration found: .snyk",
          };
        }

        // Check .gitlab-ci.yml
        const gitlabCi = await readFileContent(repoPath, ".gitlab-ci.yml");
        if (gitlabCi && scanPatterns.test(gitlabCi)) {
          return {
            criterionId: "security-scanning",
            pass: true,
            message: "Security scanning found in .gitlab-ci.yml",
          };
        }

        return {
          criterionId: "security-scanning",
          pass: false,
          message: "No security scanning configured in CI.",
          details:
            "Add CodeQL, Snyk, Trivy, or Semgrep to your CI pipeline for vulnerability scanning.",
        };
      },
    },
    {
      id: "secrets-detection",
      name: "Secrets detection configured",
      description:
        "A secrets detection tool is configured (gitleaks, detect-secrets, or similar).",
      pillarId: "security",
      level: 4,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check for gitleaks config
        const gitleaksFound = await fileExists(repoPath, ".gitleaks.toml");
        if (gitleaksFound) {
          return {
            criterionId: "secrets-detection",
            pass: true,
            message: "Gitleaks configuration found: .gitleaks.toml",
          };
        }

        // Check .pre-commit-config.yaml for detect-secrets or gitleaks
        const precommitContent = await readFileContent(
          repoPath,
          ".pre-commit-config.yaml",
        );
        if (precommitContent) {
          if (
            precommitContent.includes("detect-secrets") ||
            precommitContent.includes("gitleaks")
          ) {
            return {
              criterionId: "secrets-detection",
              pass: true,
              message:
                "Secrets detection hook found in .pre-commit-config.yaml",
            };
          }
        }

        // Check CI workflows for secrets detection
        const ciFiles = await fg(
          [".github/workflows/*.yml", ".github/workflows/*.yaml"],
          { cwd: repoPath, absolute: false, dot: true },
        );

        for (const ciFile of ciFiles) {
          const content = await readFileContent(repoPath, ciFile);
          if (
            content &&
            /\b(gitleaks|detect-secrets|trufflehog|git-secrets)\b/i.test(
              content,
            )
          ) {
            return {
              criterionId: "secrets-detection",
              pass: true,
              message: `Secrets detection found in CI: ${ciFile}`,
            };
          }
        }

        return {
          criterionId: "secrets-detection",
          pass: false,
          message: "No secrets detection tool configured.",
          details:
            "Add gitleaks, detect-secrets, or trufflehog to prevent secrets from being committed.",
        };
      },
    },
    {
      id: "security-policy",
      name: "Security policy",
      description:
        "A SECURITY.md file exists outlining the security disclosure process.",
      pillarId: "security",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "SECURITY.md",
          ".github/SECURITY.md",
        );
        if (found) {
          return {
            criterionId: "security-policy",
            pass: true,
            message: `Security policy found: ${found}`,
          };
        }
        return {
          criterionId: "security-policy",
          pass: false,
          message: "No security policy found.",
          details:
            "Add a SECURITY.md to document how to report security vulnerabilities.",
        };
      },
    },
    {
      id: "dep-update-automation",
      name: "Dependency update automation",
      description:
        "Automated dependency updates are configured (Dependabot, Renovate).",
      pillarId: "security",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          ".github/dependabot.yml",
          ".github/dependabot.yaml",
          "renovate.json",
          ".renovaterc",
          ".renovaterc.json",
        );
        if (found) {
          return {
            criterionId: "dep-update-automation",
            pass: true,
            message: `Dependency update automation found: ${found}`,
          };
        }
        return {
          criterionId: "dep-update-automation",
          pass: false,
          message: "No dependency update automation found.",
          details:
            "Add Dependabot or Renovate to automatically keep dependencies up to date.",
        };
      },
    },
  ],
};

export default security;
