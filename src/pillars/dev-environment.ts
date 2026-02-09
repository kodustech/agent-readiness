import type { Pillar } from "../types/index.js";
import {
  fileExists,
  readFileContent,
  packageJsonHas,
} from "./utils.js";

const devEnvironment: Pillar = {
  id: "dev-environment",
  name: "Developer Environment",
  description:
    "Checks that the project provides a reproducible, well-documented developer environment.",
  icon: "\uD83D\uDD27",
  criteria: [
    {
      id: "lock-file",
      name: "Lock file present",
      description:
        "A dependency lock file exists (package-lock.json, yarn.lock, pnpm-lock.yaml, go.sum, etc.).",
      pillarId: "dev-environment",
      level: 1,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "package-lock.json",
          "bun.lockb",
          "yarn.lock",
          "pnpm-lock.yaml",
          "poetry.lock",
          "Pipfile.lock",
          "go.sum",
          "Cargo.lock",
          "gradle.lockfile",
          "gradle/verification-metadata.xml",
        );
        if (found) {
          return {
            criterionId: "lock-file",
            pass: true,
            message: `Lock file found: ${found}`,
          };
        }
        return {
          criterionId: "lock-file",
          pass: false,
          message: "No dependency lock file found.",
          details:
            "Commit a lock file to ensure reproducible dependency resolution.",
        };
      },
    },
    {
      id: "containerization",
      name: "Containerization",
      description:
        "The project includes container configuration (Dockerfile, docker-compose, devcontainer).",
      pillarId: "dev-environment",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "Dockerfile",
          "docker-compose.yml",
          "docker-compose.yaml",
          ".devcontainer",
          "**/Dockerfile",
          "**/docker-compose.yml",
          "**/docker-compose.yaml",
          "docker/Dockerfile",
          "deploy/Dockerfile",
          ".devcontainer/devcontainer.json",
        );
        if (found) {
          return {
            criterionId: "containerization",
            pass: true,
            message: `Container configuration found: ${found}`,
          };
        }
        return {
          criterionId: "containerization",
          pass: false,
          message: "No container configuration found.",
          details:
            "Add a Dockerfile, docker-compose, or .devcontainer for reproducible environments.",
        };
      },
    },
    {
      id: "env-documentation",
      name: "Environment variables documented",
      description:
        "An .env.example, .env.template, or .env.sample file documents required environment variables.",
      pillarId: "dev-environment",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          ".env.example",
          ".env.template",
          ".env.sample",
        );
        if (found) {
          return {
            criterionId: "env-documentation",
            pass: true,
            message: `Environment documentation found: ${found}`,
          };
        }
        return {
          criterionId: "env-documentation",
          pass: false,
          message: "No environment variable documentation found.",
          details:
            "Add a .env.example file listing all required environment variables.",
        };
      },
    },
    {
      id: "setup-script",
      name: "Setup script or dev command",
      description:
        'A setup script or dev command is available (Makefile setup/install, scripts/setup, package.json "dev").',
      pillarId: "dev-environment",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check Makefile for setup or install targets
        const makefile = await readFileContent(repoPath, "Makefile");
        if (makefile) {
          if (/^(setup|install)\s*:/m.test(makefile)) {
            return {
              criterionId: "setup-script",
              pass: true,
              message: "Setup/install target found in Makefile",
            };
          }
        }

        // Check scripts/setup*
        const setupScript = await fileExists(repoPath, "scripts/setup*");
        if (setupScript) {
          return {
            criterionId: "setup-script",
            pass: true,
            message: `Setup script found: ${setupScript}`,
          };
        }

        // Check for Gradle wrapper (gradlew) as setup mechanism
        const gradlewFound = await fileExists(repoPath, "gradlew");
        if (gradlewFound) {
          return {
            criterionId: "setup-script",
            pass: true,
            message: "Gradle wrapper (gradlew) found as setup mechanism",
          };
        }

        // Check for Maven wrapper (mvnw) as setup mechanism
        const mvnwFound = await fileExists(repoPath, "mvnw");
        if (mvnwFound) {
          return {
            criterionId: "setup-script",
            pass: true,
            message: "Maven wrapper (mvnw) found as setup mechanism",
          };
        }

        // Check package.json for "dev" script
        const hasDevScript = await packageJsonHas(repoPath, "scripts.dev");
        if (hasDevScript) {
          return {
            criterionId: "setup-script",
            pass: true,
            message: '"dev" script found in package.json',
          };
        }

        return {
          criterionId: "setup-script",
          pass: false,
          message: "No setup script or dev command found.",
          details:
            'Add a Makefile with setup/install targets, scripts/setup, or a "dev" script in package.json.',
        };
      },
    },
    {
      id: "version-pinned",
      name: "Runtime version pinned",
      description:
        "The runtime/language version is pinned (.nvmrc, .python-version, .tool-versions, go.mod).",
      pillarId: "dev-environment",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          ".nvmrc",
          ".node-version",
          ".python-version",
          ".tool-versions",
          ".mise.toml",
          "go.mod",
          ".sdkmanrc",
          ".java-version",
          "gradle.properties",
          "rust-toolchain.toml",
          "rust-toolchain",
        );
        if (found) {
          return {
            criterionId: "version-pinned",
            pass: true,
            message: `Version pinning found: ${found}`,
          };
        }
        return {
          criterionId: "version-pinned",
          pass: false,
          message: "No runtime version pinning found.",
          details:
            "Add .nvmrc, .python-version, .tool-versions, or .mise.toml to pin runtime versions.",
        };
      },
    },
  ],
};

export default devEnvironment;
