import type { Pillar } from "../types/index.js";
import { fileExists, readFileContent } from "./utils.js";
import fg from "fast-glob";

const documentation: Pillar = {
  id: "documentation",
  name: "Documentation",
  description:
    "Assesses the quality and breadth of project documentation for both humans and AI agents.",
  icon: "\uD83D\uDCDA",
  criteria: [
    {
      id: "readme",
      name: "README with substance",
      description:
        "A README.md exists and has meaningful content (more than 500 characters).",
      pillarId: "documentation",
      level: 1,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(repoPath, "README.md", "readme.md", "Readme.md");
        if (!found) {
          return {
            criterionId: "readme",
            pass: false,
            message: "No README.md found.",
            details: "Add a README.md with project overview, setup instructions, and usage.",
          };
        }
        const content = await readFileContent(repoPath, found);
        if (content && content.length > 500) {
          return {
            criterionId: "readme",
            pass: true,
            message: `README.md found with ${content.length} characters`,
          };
        }
        return {
          criterionId: "readme",
          pass: false,
          message: `README.md found but has only ${content?.length ?? 0} characters (needs >500).`,
          details: "Expand your README with project overview, setup instructions, and usage examples.",
        };
      },
    },
    {
      id: "contributing",
      name: "Contributing guide",
      description:
        "A CONTRIBUTING.md or docs/contributing guide exists to help new contributors.",
      pillarId: "documentation",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "CONTRIBUTING.md",
          "docs/contributing*",
        );
        if (found) {
          return {
            criterionId: "contributing",
            pass: true,
            message: `Contributing guide found: ${found}`,
          };
        }
        return {
          criterionId: "contributing",
          pass: false,
          message: "No contributing guide found.",
          details: "Add a CONTRIBUTING.md to document how to contribute to the project.",
        };
      },
    },
    {
      id: "api-docs",
      name: "API documentation",
      description:
        "API documentation exists (OpenAPI/Swagger specs, JSDoc/TypeDoc config, docs/api).",
      pillarId: "documentation",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "openapi.*",
          "swagger.*",
          "docs/api*",
          "jsdoc.json",
          "typedoc.json",
        );
        if (found) {
          return {
            criterionId: "api-docs",
            pass: true,
            message: `API documentation found: ${found}`,
          };
        }
        return {
          criterionId: "api-docs",
          pass: false,
          message: "No API documentation found.",
          details:
            "Add OpenAPI/Swagger specs, JSDoc/TypeDoc config, or a docs/api directory.",
        };
      },
    },
    {
      id: "codeowners",
      name: "CODEOWNERS defined",
      description:
        "A CODEOWNERS file is present to define ownership of code areas.",
      pillarId: "documentation",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "CODEOWNERS",
          ".github/CODEOWNERS",
        );
        if (found) {
          return {
            criterionId: "codeowners",
            pass: true,
            message: `CODEOWNERS found: ${found}`,
          };
        }
        return {
          criterionId: "codeowners",
          pass: false,
          message: "No CODEOWNERS file found.",
          details:
            "Add a CODEOWNERS file to assign ownership of different parts of the codebase.",
        };
      },
    },
    {
      id: "ai-context",
      name: "AI context files",
      description:
        "AI-specific context files exist (CLAUDE.md, .cursor/rules, copilot-instructions.md).",
      pillarId: "documentation",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "CLAUDE.md",
          ".cursor/rules",
          ".cursorrules",
          ".github/copilot-instructions.md",
        );
        if (found) {
          return {
            criterionId: "ai-context",
            pass: true,
            message: `AI context file found: ${found}`,
          };
        }
        return {
          criterionId: "ai-context",
          pass: false,
          message: "No AI context files found.",
          details:
            "Add CLAUDE.md, .cursorrules, or .github/copilot-instructions.md to provide context for AI agents.",
        };
      },
    },
    {
      id: "architecture-docs",
      name: "Architecture documentation",
      description:
        "Architecture documentation or ADRs exist (docs/architecture, docs/adr, ARCHITECTURE.md).",
      pillarId: "documentation",
      level: 4,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const found = await fileExists(
          repoPath,
          "docs/architecture*",
          "docs/adr/*",
          "ARCHITECTURE.md",
        );
        if (found) {
          return {
            criterionId: "architecture-docs",
            pass: true,
            message: `Architecture documentation found: ${found}`,
          };
        }
        return {
          criterionId: "architecture-docs",
          pass: false,
          message: "No architecture documentation found.",
          details:
            "Add docs/architecture, docs/adr, or ARCHITECTURE.md to document high-level design decisions.",
        };
      },
    },
    {
      id: "readme-quality",
      name: "README quality (AI)",
      description:
        "The README effectively communicates project purpose, setup, usage, and contributing guidelines.",
      pillarId: "documentation",
      level: 5,
      requiresLLM: true,
      check: async (repoPath, _projectInfo, llmClient) => {
        const readmeFile = await fileExists(repoPath, "README.md", "readme.md", "Readme.md");
        if (!readmeFile) {
          return {
            criterionId: "readme-quality",
            pass: false,
            message: "No README.md found to evaluate.",
          };
        }
        const content = await readFileContent(repoPath, readmeFile);
        if (!content || !llmClient) {
          return {
            criterionId: "readme-quality",
            pass: false,
            message: "Unable to evaluate README quality.",
          };
        }
        return llmClient.evaluate(
          "Evaluate this README for quality. A good README should cover: project overview/purpose, installation/setup instructions, usage examples, and how to contribute. Does it have clear structure with headings? Is it helpful for someone new to the project? Is it useful for an AI coding agent trying to understand the project?",
          content.slice(0, 8000),
        ).then((r) => ({ ...r, criterionId: "readme-quality" }));
      },
    },
    {
      id: "docs-agent-friendliness",
      name: "Documentation agent-friendliness (AI)",
      description:
        "Documentation is structured and detailed enough for AI agents to understand the codebase.",
      pillarId: "documentation",
      level: 5,
      requiresLLM: true,
      check: async (repoPath, _projectInfo, llmClient) => {
        if (!llmClient) {
          return {
            criterionId: "docs-agent-friendliness",
            pass: false,
            message: "Unable to evaluate documentation agent-friendliness.",
          };
        }

        // Gather available documentation
        const docFiles = await fg(
          ["README.md", "CONTRIBUTING.md", "CLAUDE.md", ".cursorrules", "docs/**/*.md", "ARCHITECTURE.md"],
          { cwd: repoPath, absolute: false, dot: true },
        );

        if (docFiles.length === 0) {
          return {
            criterionId: "docs-agent-friendliness",
            pass: false,
            message: "No documentation files found to evaluate.",
          };
        }

        const snippets: string[] = [];
        for (const file of docFiles.slice(0, 5)) {
          const content = await readFileContent(repoPath, file);
          if (content) {
            snippets.push(`--- ${file} ---\n${content.slice(0, 3000)}`);
          }
        }

        return llmClient.evaluate(
          "Evaluate these documentation files for AI-agent-friendliness. Good agent-friendly docs should: explain project structure, describe key abstractions, specify coding conventions, note testing patterns, and provide context that helps an AI agent make correct changes. Are these docs sufficient for an autonomous coding agent to work on this project effectively?",
          snippets.join("\n\n"),
        ).then((r) => ({ ...r, criterionId: "docs-agent-friendliness" }));
      },
    },
  ],
};

export default documentation;
