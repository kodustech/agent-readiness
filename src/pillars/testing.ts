import type { Pillar } from "../types/index.js";
import {
  fileExists,
  readFileContent,
  packageJsonHas,
} from "./utils.js";
import fg from "fast-glob";

const testing: Pillar = {
  id: "testing",
  name: "Testing",
  description:
    "Evaluates the presence, breadth, and automation of the project's test suite.",
  icon: "\uD83E\uDDEA",
  criteria: [
    {
      id: "test-framework",
      name: "Test framework configured",
      description:
        "A test framework is installed and configured (Jest, Vitest, pytest, Go testing).",
      pillarId: "testing",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "jest.config.*",
          "vitest.config.*",
          "pytest.ini",
          "conftest.py",
        );
        if (found) {
          return {
            criterionId: "test-framework",
            pass: true,
            message: `Test framework configuration found: ${found}`,
          };
        }

        // Check for Go test files
        const goTests = await fg("**/*_test.go", {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**", "vendor/**"],
        });
        if (goTests.length > 0) {
          return {
            criterionId: "test-framework",
            pass: true,
            message: `Go test files found (${goTests.length} files)`,
          };
        }

        // Check for pytest in pyproject.toml
        const pyproject = await readFileContent(repoPath, "pyproject.toml");
        if (pyproject && pyproject.includes("[tool.pytest")) {
          return {
            criterionId: "test-framework",
            pass: true,
            message: "pytest configuration found in pyproject.toml",
          };
        }

        // Check for Kotlin test frameworks in build.gradle.kts
        const buildGradleKts = await readFileContent(repoPath, "build.gradle.kts");
        if (buildGradleKts) {
          if (buildGradleKts.includes("kotest")) {
            return {
              criterionId: "test-framework",
              pass: true,
              message: "Kotest framework found in build.gradle.kts",
            };
          }
          if (
            buildGradleKts.includes("junit") ||
            buildGradleKts.includes("jupiter") ||
            buildGradleKts.includes("kotlin.test") ||
            buildGradleKts.includes("kotlin(\"test\")")
          ) {
            return {
              criterionId: "test-framework",
              pass: true,
              message: "Kotlin/JUnit test framework found in build.gradle.kts",
            };
          }
          if (buildGradleKts.includes("testImplementation")) {
            return {
              criterionId: "test-framework",
              pass: true,
              message: "Test dependencies found in build.gradle.kts",
            };
          }
        }

        // Check build.gradle (Groovy DSL) for Java/Kotlin test deps
        const buildGradle = await readFileContent(repoPath, "build.gradle");
        if (buildGradle) {
          if (
            buildGradle.includes("junit") ||
            buildGradle.includes("jupiter") ||
            buildGradle.includes("kotest") ||
            buildGradle.includes("kotlin.test") ||
            buildGradle.includes("testng") ||
            buildGradle.includes("testImplementation")
          ) {
            return {
              criterionId: "test-framework",
              pass: true,
              message: "Test framework found in build.gradle",
            };
          }
        }

        // Check pom.xml for Java test frameworks
        const pomXml = await readFileContent(repoPath, "pom.xml");
        if (pomXml) {
          if (pomXml.includes("junit") || pomXml.includes("testng") || pomXml.includes("jupiter")) {
            return {
              criterionId: "test-framework",
              pass: true,
              message: "Java test framework found in pom.xml",
            };
          }
        }

        // Check for Rust tests (built-in #[test] support, check for tests/ dir or Cargo.toml)
        const cargoToml = await readFileContent(repoPath, "Cargo.toml");
        if (cargoToml) {
          // Rust has built-in testing; check for tests dir or dev-dependencies
          const testsDir = await fileExists(repoPath, "tests");
          if (testsDir) {
            return {
              criterionId: "test-framework",
              pass: true,
              message: "Rust integration tests directory found (tests/)",
            };
          }
          if (cargoToml.includes("[dev-dependencies]")) {
            return {
              criterionId: "test-framework",
              pass: true,
              message: "Rust dev-dependencies found in Cargo.toml (built-in #[test] support)",
            };
          }
          // Rust always has built-in test support
          return {
            criterionId: "test-framework",
            pass: true,
            message: "Rust project detected (built-in #[test] framework)",
          };
        }

        return {
          criterionId: "test-framework",
          pass: false,
          message: "No test framework configuration found.",
          details:
            "Set up Jest, Vitest, pytest, Go testing, JUnit, Kotest, or cargo test to enable automated testing.",
        };
      },
    },
    {
      id: "test-files-exist",
      name: "Test files exist",
      description:
        "The project contains actual test files (.test.*, .spec.*, test_*.py, *_test.go).",
      pillarId: "testing",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const testFiles = await fg(
          [
            "**/*.test.*",
            "**/*.spec.*",
            "**/test_*.py",
            "**/*_test.go",
            "**/*Test.kt",
            "**/*Tests.kt",
            "**/*Spec.kt",
            "src/test/**/*.kt",
            "**/*Test.java",
            "**/*Tests.java",
            "src/test/**/*.java",
            "tests/**/*.rs",
            "src/**/tests.rs",
            "src/**/test_*.rs",
          ],
          {
            cwd: repoPath,
            absolute: false,
            ignore: ["node_modules/**", "vendor/**", "dist/**", ".next/**", "build/**", "target/**"],
          },
        );
        if (testFiles.length > 0) {
          return {
            criterionId: "test-files-exist",
            pass: true,
            message: `Found ${testFiles.length} test file(s)`,
            details: testFiles.slice(0, 10).join(", "),
          };
        }
        return {
          criterionId: "test-files-exist",
          pass: false,
          message: "No test files found.",
          details:
            "Add test files following naming conventions: *.test.ts, test_*.py, *_test.go, *Test.kt, *Test.java, tests/*.rs.",
        };
      },
    },
    {
      id: "test-script",
      name: "Test script defined",
      description:
        'A "test" script is defined in package.json or a test target in Makefile.',
      pillarId: "testing",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const hasTestScript = await packageJsonHas(
          repoPath,
          "scripts.test",
        );
        if (hasTestScript) {
          return {
            criterionId: "test-script",
            pass: true,
            message: '"test" script found in package.json',
          };
        }

        // Check Makefile for test target
        const makefile = await readFileContent(repoPath, "Makefile");
        if (makefile && /^test\s*:/m.test(makefile)) {
          return {
            criterionId: "test-script",
            pass: true,
            message: '"test" target found in Makefile',
          };
        }

        // Check for Gradle wrapper (gradlew) which provides ./gradlew test
        const gradlewFound = await fileExists(repoPath, "gradlew");
        if (gradlewFound) {
          return {
            criterionId: "test-script",
            pass: true,
            message: "Gradle wrapper found (provides ./gradlew test)",
          };
        }

        // Check for build.gradle.kts or build.gradle (Gradle projects have built-in test task)
        const gradleBuildFound = await fileExists(repoPath, "build.gradle.kts", "build.gradle");
        if (gradleBuildFound) {
          return {
            criterionId: "test-script",
            pass: true,
            message: "Gradle build file found (provides gradle test task)",
          };
        }

        // Check for Maven wrapper (mvnw)
        const mvnwFound = await fileExists(repoPath, "mvnw");
        if (mvnwFound) {
          return {
            criterionId: "test-script",
            pass: true,
            message: "Maven wrapper found (provides ./mvnw test)",
          };
        }

        // Check for pom.xml (Maven projects have built-in test phase)
        const pomFound = await fileExists(repoPath, "pom.xml");
        if (pomFound) {
          return {
            criterionId: "test-script",
            pass: true,
            message: "Maven pom.xml found (provides mvn test phase)",
          };
        }

        // Check for Cargo.toml (Rust projects have built-in cargo test)
        const cargoFound = await fileExists(repoPath, "Cargo.toml");
        if (cargoFound) {
          return {
            criterionId: "test-script",
            pass: true,
            message: "Cargo.toml found (provides cargo test)",
          };
        }

        return {
          criterionId: "test-script",
          pass: false,
          message: "No test script or target found.",
          details:
            'Add a "test" script in package.json, Makefile, Gradle, Maven, or Cargo.',
        };
      },
    },
    {
      id: "coverage-config",
      name: "Coverage configured",
      description:
        "Test coverage reporting is configured (coverage in Jest/Vitest, .coveragerc, .nycrc).",
      pillarId: "testing",
      level: 4,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        // Check dedicated coverage config files
        const found = await fileExists(
          repoPath,
          ".coveragerc",
          ".nycrc",
          ".nycrc.*",
        );
        if (found) {
          return {
            criterionId: "coverage-config",
            pass: true,
            message: `Coverage configuration found: ${found}`,
          };
        }

        // Check jest config for coverage
        const jestConfig = await fileExists(repoPath, "jest.config.*");
        if (jestConfig) {
          const content = await readFileContent(repoPath, jestConfig);
          if (content && content.includes("coverage")) {
            return {
              criterionId: "coverage-config",
              pass: true,
              message: `Coverage configured in ${jestConfig}`,
            };
          }
        }

        // Check vitest config for coverage
        const vitestConfig = await fileExists(repoPath, "vitest.config.*");
        if (vitestConfig) {
          const content = await readFileContent(repoPath, vitestConfig);
          if (content && content.includes("coverage")) {
            return {
              criterionId: "coverage-config",
              pass: true,
              message: `Coverage configured in ${vitestConfig}`,
            };
          }
        }

        // Check build.gradle.kts for JaCoCo or Kover coverage
        const buildGradleKtsCov = await readFileContent(repoPath, "build.gradle.kts");
        if (buildGradleKtsCov) {
          if (buildGradleKtsCov.includes("jacoco")) {
            return {
              criterionId: "coverage-config",
              pass: true,
              message: "JaCoCo coverage plugin configured in build.gradle.kts",
            };
          }
          if (buildGradleKtsCov.includes("kover") || buildGradleKtsCov.includes("kotlinx-kover")) {
            return {
              criterionId: "coverage-config",
              pass: true,
              message: "Kover coverage plugin configured in build.gradle.kts",
            };
          }
        }

        // Check build.gradle (Groovy) for JaCoCo
        const buildGradleCov = await readFileContent(repoPath, "build.gradle");
        if (buildGradleCov && buildGradleCov.includes("jacoco")) {
          return {
            criterionId: "coverage-config",
            pass: true,
            message: "JaCoCo coverage plugin configured in build.gradle",
          };
        }

        // Check pom.xml for JaCoCo
        const pomXmlCov = await readFileContent(repoPath, "pom.xml");
        if (pomXmlCov && pomXmlCov.includes("jacoco")) {
          return {
            criterionId: "coverage-config",
            pass: true,
            message: "JaCoCo coverage plugin found in pom.xml",
          };
        }

        // Check for Rust coverage tools (tarpaulin, llvm-cov)
        const tarpaulinConfig = await fileExists(repoPath, ".tarpaulin.toml", "tarpaulin.toml");
        if (tarpaulinConfig) {
          return {
            criterionId: "coverage-config",
            pass: true,
            message: `Rust tarpaulin coverage configured: ${tarpaulinConfig}`,
          };
        }
        const cargoTomlCov = await readFileContent(repoPath, "Cargo.toml");
        if (cargoTomlCov && (cargoTomlCov.includes("cargo-tarpaulin") || cargoTomlCov.includes("cargo-llvm-cov"))) {
          return {
            criterionId: "coverage-config",
            pass: true,
            message: "Rust coverage tool found in Cargo.toml",
          };
        }

        // Check CI config files for coverage mentions
        const ciFiles = await fg(
          [".github/workflows/*.yml", ".github/workflows/*.yaml"],
          { cwd: repoPath, absolute: false, dot: true },
        );
        for (const ciFile of ciFiles) {
          const content = await readFileContent(repoPath, ciFile);
          if (content && content.includes("coverage")) {
            return {
              criterionId: "coverage-config",
              pass: true,
              message: `Coverage mentioned in CI config: ${ciFile}`,
            };
          }
        }

        return {
          criterionId: "coverage-config",
          pass: false,
          message: "No coverage configuration found.",
          details:
            "Configure test coverage reporting in your test framework, CI pipeline, JaCoCo, or Kover.",
        };
      },
    },
    {
      id: "e2e-tests",
      name: "E2E / integration tests",
      description:
        "End-to-end or integration tests are configured (Playwright, Cypress, e2e directories).",
      pillarId: "testing",
      level: 4,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "playwright.config.*",
          "cypress.config.*",
          "cypress",
          "e2e",
          "tests/e2e",
          "integration",
        );
        if (found) {
          return {
            criterionId: "e2e-tests",
            pass: true,
            message: `E2E / integration testing found: ${found}`,
          };
        }
        return {
          criterionId: "e2e-tests",
          pass: false,
          message: "No E2E or integration test setup found.",
          details:
            "Add Playwright, Cypress, or an e2e/integration directory for higher-level tests.",
        };
      },
    },
    {
      id: "test-quality",
      name: "Test quality (AI)",
      description:
        "Tests are meaningful, well-structured, and provide good coverage of key functionality.",
      pillarId: "testing",
      level: 5,
      requiresLLM: true,
      check: async (repoPath, _projectInfo, llmClient) => {
        if (!llmClient) {
          return {
            criterionId: "test-quality",
            pass: false,
            message: "Unable to evaluate test quality.",
          };
        }

        const testFiles = await fg(
          ["**/*.test.*", "**/*.spec.*", "**/test_*.py", "**/*_test.go", "**/*Test.kt", "**/*Spec.kt", "src/test/**/*.kt", "**/*Test.java", "src/test/**/*.java", "tests/**/*.rs"],
          {
            cwd: repoPath,
            absolute: false,
            ignore: ["node_modules/**", "vendor/**", "dist/**", "build/**", "target/**"],
          },
        );

        if (testFiles.length === 0) {
          return {
            criterionId: "test-quality",
            pass: false,
            message: "No test files found to evaluate quality.",
          };
        }

        // Sample up to 3 test files
        const sampled = testFiles.slice(0, 3);
        const snippets: string[] = [];
        for (const file of sampled) {
          const content = await readFileContent(repoPath, file);
          if (content) {
            snippets.push(`--- ${file} ---\n${content.slice(0, 4000)}`);
          }
        }

        return llmClient.evaluate(
          "Evaluate the quality of these test files. Good tests should: test meaningful behavior (not just implementation details), have descriptive test names, cover both happy path and error cases, be readable and maintainable, and avoid excessive mocking. Are these tests sufficient for an AI agent to confidently make changes and verify correctness?",
          snippets.join("\n\n"),
        ).then((r) => ({ ...r, criterionId: "test-quality" }));
      },
    },
  ],
};

export default testing;
