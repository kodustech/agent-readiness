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
          "detekt.yml",
          ".detekt.yml",
          "detekt-config.yml",
        );
        if (found) {
          return {
            criterionId: "linter",
            pass: true,
            message: `Linter configuration found: ${found}`,
          };
        }

        // Check for Kotlin/Java linters in build.gradle.kts or build.gradle
        for (const gradleFile of ["build.gradle.kts", "build.gradle"]) {
          const gradleContent = await readFileContent(repoPath, gradleFile);
          if (gradleContent) {
            if (gradleContent.includes("detekt")) {
              return { criterionId: "linter", pass: true, message: `detekt linter configured in ${gradleFile}` };
            }
            if (gradleContent.includes("ktlint")) {
              return { criterionId: "linter", pass: true, message: `ktlint linter configured in ${gradleFile}` };
            }
            if (gradleContent.includes("checkstyle")) {
              return { criterionId: "linter", pass: true, message: `Checkstyle configured in ${gradleFile}` };
            }
            if (gradleContent.includes("pmd")) {
              return { criterionId: "linter", pass: true, message: `PMD configured in ${gradleFile}` };
            }
            if (gradleContent.includes("spotbugs")) {
              return { criterionId: "linter", pass: true, message: `SpotBugs configured in ${gradleFile}` };
            }
          }
        }

        // Check Java Checkstyle/PMD config files
        const javaLinterFound = await fileExists(
          repoPath,
          "checkstyle.xml",
          ".checkstyle",
          "pmd.xml",
          ".pmd",
          "spotbugs-exclude.xml",
        );
        if (javaLinterFound) {
          return { criterionId: "linter", pass: true, message: `Java linter configuration found: ${javaLinterFound}` };
        }

        // Check pom.xml for Java linter plugins
        const pomXml = await readFileContent(repoPath, "pom.xml");
        if (pomXml) {
          if (pomXml.includes("checkstyle") || pomXml.includes("maven-pmd-plugin") || pomXml.includes("spotbugs")) {
            return { criterionId: "linter", pass: true, message: "Java linter plugin found in pom.xml" };
          }
        }

        // Check for Rust clippy config
        const clippyFound = await fileExists(repoPath, "clippy.toml", ".clippy.toml");
        if (clippyFound) {
          return { criterionId: "linter", pass: true, message: `Clippy configuration found: ${clippyFound}` };
        }

        // Rust projects with Cargo.toml have clippy built-in
        const cargoFound = await fileExists(repoPath, "Cargo.toml");
        if (cargoFound) {
          return { criterionId: "linter", pass: true, message: "Rust project detected (clippy is built-in via cargo clippy)" };
        }

        return {
          criterionId: "linter",
          pass: false,
          message: "No linter configuration found.",
          details:
            "Add ESLint, Biome, Ruff, golangci-lint, detekt, ktlint, Checkstyle, or clippy configuration to enforce code quality.",
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

        // Go has gofmt built-in
        if (_projectInfo.detectedTypes.includes("go")) {
          return { criterionId: "formatter", pass: true, message: "Go has built-in formatting via gofmt/goimports" };
        }

        // Rust: check for rustfmt config
        const rustfmtFound = await fileExists(repoPath, "rustfmt.toml", ".rustfmt.toml");
        if (rustfmtFound) {
          return { criterionId: "formatter", pass: true, message: `Rust formatter configuration found: ${rustfmtFound}` };
        }
        // Rust projects have rustfmt built-in
        if (_projectInfo.detectedTypes.includes("rust")) {
          return { criterionId: "formatter", pass: true, message: "Rust project detected (rustfmt is built-in via cargo fmt)" };
        }

        // Check Gradle files for Kotlin/Java formatters (ktlint, ktfmt, spotless, google-java-format)
        for (const gradleFile of ["build.gradle.kts", "build.gradle"]) {
          const gradleContent = await readFileContent(repoPath, gradleFile);
          if (gradleContent) {
            if (gradleContent.includes("ktlint") || gradleContent.includes("org.jlleitschuh.gradle.ktlint")) {
              return { criterionId: "formatter", pass: true, message: `ktlint formatter configured in ${gradleFile}` };
            }
            if (gradleContent.includes("ktfmt")) {
              return { criterionId: "formatter", pass: true, message: `ktfmt formatter configured in ${gradleFile}` };
            }
            if (gradleContent.includes("spotless")) {
              return { criterionId: "formatter", pass: true, message: `Spotless formatter configured in ${gradleFile}` };
            }
            if (gradleContent.includes("google-java-format")) {
              return { criterionId: "formatter", pass: true, message: `google-java-format configured in ${gradleFile}` };
            }
          }
        }

        // Check pom.xml for Java formatters
        const pomXmlFmt = await readFileContent(repoPath, "pom.xml");
        if (pomXmlFmt) {
          if (pomXmlFmt.includes("spotless") || pomXmlFmt.includes("google-java-format") || pomXmlFmt.includes("formatter-maven-plugin")) {
            return { criterionId: "formatter", pass: true, message: "Java formatter plugin found in pom.xml" };
          }
        }

        return {
          criterionId: "formatter",
          pass: false,
          message: "No formatter configuration found.",
          details:
            "Add Prettier, Biome, Black, Ruff, ktlint, ktfmt, Spotless, google-java-format, or rustfmt to enforce consistent code formatting.",
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
        // Statically typed languages get auto-pass
        const staticLangs: [string, string][] = [
          ["kotlin", "Kotlin has a built-in static type system with null safety"],
          ["go", "Go has a built-in static type system"],
          ["java", "Java has a built-in static type system"],
          ["rust", "Rust has a built-in static type system with ownership model"],
        ];
        for (const [lang, msg] of staticLangs) {
          if (_projectInfo.detectedTypes.includes(lang)) {
            return { criterionId: "type-checker", pass: true, message: msg };
          }
        }

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
          ["**/*.{ts,tsx,js,jsx,py,go,rs,kt,kts,java}", "!node_modules/**", "!vendor/**", "!dist/**", "!build/**", "!target/**"],
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
