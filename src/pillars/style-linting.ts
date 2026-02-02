import type { Pillar } from "../types/index.js";
import { fileExists, readFileContent, packageJsonHas } from "./utils.js";
import fg from "fast-glob";

const styleLinting: Pillar = {
  id: "style-linting",
  name: "Style & Linting",
  description:
    "Ensures the project enforces consistent code style and catches errors through static analysis.",
  icon: "\uD83C\uDFA8",
  criteria: [
    {
      id: "linter",
      name: "Linter configured",
      description:
        "A static analysis linter is configured (ESLint, Biome, Ruff, golangci-lint, etc.).",
      pillarId: "style-linting",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          ".eslintrc",
          ".eslintrc.*",
          "eslint.config.*",
          "biome.json",
          "biome.jsonc",
          ".ruff.toml",
          "ruff.toml",
          ".golangci.yml",
          ".golangci.yaml",
        );
        if (found) {
          return {
            criterionId: "linter",
            pass: true,
            message: `Linter configuration found: ${found}`,
          };
        }
        return {
          criterionId: "linter",
          pass: false,
          message: "No linter configuration found.",
          details:
            "Add ESLint, Biome, Ruff, or golangci-lint configuration to enforce code quality.",
        };
      },
    },
    {
      id: "formatter",
      name: "Formatter configured",
      description:
        "A code formatter is configured (Prettier, Biome formatter, Black, Ruff format).",
      pillarId: "style-linting",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check Prettier
        const prettierFound = await fileExists(
          repoPath,
          ".prettierrc",
          ".prettierrc.*",
          "prettier.config.*",
        );
        if (prettierFound) {
          return {
            criterionId: "formatter",
            pass: true,
            message: `Formatter configuration found: ${prettierFound}`,
          };
        }

        // Check Biome with formatter
        const biomeContent = await readFileContent(repoPath, "biome.json");
        if (!biomeContent) {
          const biomeContentJsonc = await readFileContent(
            repoPath,
            "biome.jsonc",
          );
          if (biomeContentJsonc && biomeContentJsonc.includes("formatter")) {
            return {
              criterionId: "formatter",
              pass: true,
              message: "Biome formatter configuration found in biome.jsonc",
            };
          }
        } else if (biomeContent.includes("formatter")) {
          return {
            criterionId: "formatter",
            pass: true,
            message: "Biome formatter configuration found in biome.json",
          };
        }

        // Check pyproject.toml for black or ruff
        const pyproject = await readFileContent(repoPath, "pyproject.toml");
        if (pyproject) {
          if (
            pyproject.includes("[tool.black]") ||
            pyproject.includes("[tool.ruff")
          ) {
            return {
              criterionId: "formatter",
              pass: true,
              message:
                "Python formatter configuration found in pyproject.toml",
            };
          }
        }

        return {
          criterionId: "formatter",
          pass: false,
          message: "No formatter configuration found.",
          details:
            "Add Prettier, Biome, Black, or Ruff configuration to enforce consistent code formatting.",
        };
      },
    },
    {
      id: "type-checker",
      name: "Type checker configured",
      description:
        "A type-checking tool is configured in strict mode (TypeScript strict, mypy, pyright).",
      pillarId: "style-linting",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check tsconfig.json with strict: true
        const tsconfig = await readFileContent(repoPath, "tsconfig.json");
        if (tsconfig) {
          try {
            // Strip comments (simple approach for JSON with comments)
            const stripped = tsconfig.replace(
              /\/\/.*$|\/\*[\s\S]*?\*\//gm,
              "",
            );
            const parsed = JSON.parse(stripped);
            if (parsed?.compilerOptions?.strict === true) {
              return {
                criterionId: "type-checker",
                pass: true,
                message:
                  "TypeScript configured with strict mode in tsconfig.json",
              };
            }
          } catch {
            // If we can't parse, fall through to other checks
          }
        }

        // Check mypy
        const mypyFound = await fileExists(
          repoPath,
          "mypy.ini",
          ".mypy.ini",
        );
        if (mypyFound) {
          return {
            criterionId: "type-checker",
            pass: true,
            message: `Type checker configuration found: ${mypyFound}`,
          };
        }

        // Check setup.cfg with [mypy]
        const setupCfg = await readFileContent(repoPath, "setup.cfg");
        if (setupCfg && setupCfg.includes("[mypy]")) {
          return {
            criterionId: "type-checker",
            pass: true,
            message: "mypy configuration found in setup.cfg",
          };
        }

        // Check pyright
        const pyrightFound = await fileExists(repoPath, "pyrightconfig.json");
        if (pyrightFound) {
          return {
            criterionId: "type-checker",
            pass: true,
            message: "Pyright configuration found: pyrightconfig.json",
          };
        }

        return {
          criterionId: "type-checker",
          pass: false,
          message: "No type checker with strict mode found.",
          details:
            "Enable TypeScript strict mode, or add mypy/pyright for Python projects.",
        };
      },
    },
    {
      id: "pre-commit-hooks",
      name: "Pre-commit hooks configured",
      description:
        "Git hooks are configured to run linting/formatting before commits (Husky, Lefthook, pre-commit).",
      pillarId: "style-linting",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          ".husky",
          ".lefthook.yml",
          "lefthook.yml",
          ".pre-commit-config.yaml",
        );
        if (found) {
          return {
            criterionId: "pre-commit-hooks",
            pass: true,
            message: `Pre-commit hooks configured: ${found}`,
          };
        }

        // Check lint-staged in package.json
        const hasLintStaged = await packageJsonHas(repoPath, "lint-staged");
        if (hasLintStaged) {
          return {
            criterionId: "pre-commit-hooks",
            pass: true,
            message: "lint-staged configured in package.json",
          };
        }

        return {
          criterionId: "pre-commit-hooks",
          pass: false,
          message: "No pre-commit hooks found.",
          details:
            "Add Husky, Lefthook, or pre-commit to run checks before commits.",
        };
      },
    },
    {
      id: "editorconfig",
      name: "EditorConfig present",
      description:
        "An .editorconfig file is present to enforce consistent editor settings.",
      pillarId: "style-linting",
      level: 1,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(repoPath, ".editorconfig");
        if (found) {
          return {
            criterionId: "editorconfig",
            pass: true,
            message: ".editorconfig found",
          };
        }
        return {
          criterionId: "editorconfig",
          pass: false,
          message: "No .editorconfig found.",
          details:
            "Add an .editorconfig to standardize indentation and file encoding across editors.",
        };
      },
    },
    {
      id: "naming-conventions",
      name: "Naming conventions (AI)",
      description:
        "The codebase follows consistent naming conventions for files, functions, and variables.",
      pillarId: "style-linting",
      level: 5,
      requiresLLM: true,
      check: async (repoPath, _projectInfo, llmClient) => {
        if (!llmClient) {
          return {
            criterionId: "naming-conventions",
            pass: false,
            message: "Unable to evaluate naming conventions.",
          };
        }

        const srcFiles = await fg(
          ["**/*.{ts,tsx,js,jsx,py,go,rs}", "!node_modules/**", "!vendor/**", "!dist/**"],
          { cwd: repoPath, absolute: false },
        );

        if (srcFiles.length === 0) {
          return {
            criterionId: "naming-conventions",
            pass: false,
            message: "No source files found to evaluate.",
          };
        }

        // Sample file names + a few file contents
        const fileList = srcFiles.slice(0, 30).join("\n");
        const sampled = srcFiles.slice(0, 3);
        const snippets: string[] = [`File names:\n${fileList}`];
        for (const file of sampled) {
          const content = await readFileContent(repoPath, file);
          if (content) {
            snippets.push(`--- ${file} ---\n${content.slice(0, 3000)}`);
          }
        }

        return llmClient.evaluate(
          "Evaluate naming convention consistency in this codebase. Check: Are file names consistently cased (kebab-case, camelCase, PascalCase)? Are functions/methods consistently named? Are variables descriptively named? Is there a clear pattern that an AI agent could follow when writing new code?",
          snippets.join("\n\n"),
        ).then((r) => ({ ...r, criterionId: "naming-conventions" }));
      },
    },
  ],
};

export default styleLinting;
