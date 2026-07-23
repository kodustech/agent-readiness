import type { Pillar } from "../types/index.js";
import { fileExists, readFileContent } from "./utils.js";
import fg from "fast-glob";

const dataHealth: Pillar = {
  id: "data-health",
  name: "Data Health",
  description:
    "For repos with data pipelines: assesses freshness monitoring, quality audits, schema documentation, and PII/compliance declarations — the signals a data-consuming agent needs to trust the tables it reads.",
  icon: "🩺",
  criteria: [
    {
      id: "data-freshness-monitoring",
      name: "Freshness monitoring configured",
      description:
        "Data sources declare freshness/SLA expectations (dbt source freshness, Airflow SLA, Soda/Great Expectations freshness checks).",
      pillarId: "data-health",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const dbtSources = await fg(
          ["**/sources.yml", "**/sources.yaml", "**/*.sources.yml"],
          { cwd: repoPath, absolute: false, ignore: ["node_modules/**", "dbt_packages/**"] },
        );
        for (const file of dbtSources) {
          const content = await readFileContent(repoPath, file);
          if (content && content.includes("freshness:")) {
            return {
              criterionId: "data-freshness-monitoring",
              pass: true,
              message: `dbt source freshness config found: ${file}`,
            };
          }
        }

        const dagFiles = await fg(["**/dags/**/*.py", "**/*dag*.py"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**"],
        });
        for (const file of dagFiles.slice(0, 50)) {
          const content = await readFileContent(repoPath, file);
          if (content && /\bsla\s*=/.test(content)) {
            return {
              criterionId: "data-freshness-monitoring",
              pass: true,
              message: `Airflow SLA declaration found: ${file}`,
            };
          }
        }

        const checkFiles = await fg(
          ["**/soda/**/*.yml", "**/great_expectations/**/*.yml", "**/great_expectations/**/*.json"],
          { cwd: repoPath, absolute: false, ignore: ["node_modules/**"] },
        );
        for (const file of checkFiles) {
          const content = await readFileContent(repoPath, file);
          if (content && /freshness|stale|max_age/i.test(content)) {
            return {
              criterionId: "data-freshness-monitoring",
              pass: true,
              message: `Freshness check found: ${file}`,
            };
          }
        }

        return {
          criterionId: "data-freshness-monitoring",
          pass: false,
          message: "No data freshness/SLA monitoring found.",
          details:
            "Declare `freshness:` on dbt sources, set Airflow task/DAG `sla=`, or add a Soda/Great Expectations freshness check.",
        };
      },
    },
    {
      id: "data-quality-tests",
      name: "Data quality tests configured",
      description:
        "Automated data quality checks exist (dbt tests, Great Expectations suites, Soda checks, or an audits/ directory of validation SQL).",
      pillarId: "data-health",
      level: 2,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const schemaFiles = await fg(["**/schema.yml", "**/schema.yaml", "**/*.schema.yml"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**", "dbt_packages/**"],
        });
        for (const file of schemaFiles) {
          const content = await readFileContent(repoPath, file);
          if (content && content.includes("tests:")) {
            return {
              criterionId: "data-quality-tests",
              pass: true,
              message: `dbt tests found in ${file}`,
            };
          }
        }

        const geFound = await fileExists(repoPath, "great_expectations/great_expectations.yml");
        if (geFound) {
          return {
            criterionId: "data-quality-tests",
            pass: true,
            message: "Great Expectations project found.",
          };
        }

        const sodaFound = await fg(["**/soda/**/*checks*.yml", "soda.yml"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**"],
        });
        if (sodaFound.length > 0) {
          return {
            criterionId: "data-quality-tests",
            pass: true,
            message: `Soda checks found: ${sodaFound[0]}`,
          };
        }

        const auditDirFound = await fg(["**/audits/**/*.sql", "**/audit/**/*.sql"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**"],
        });
        if (auditDirFound.length > 0) {
          return {
            criterionId: "data-quality-tests",
            pass: true,
            message: `Audit SQL found: ${auditDirFound[0]}`,
          };
        }

        return {
          criterionId: "data-quality-tests",
          pass: false,
          message: "No data quality tests found.",
          details:
            "Add dbt generic/singular tests, a Great Expectations suite, Soda checks, or an audits/ directory of validation SQL.",
        };
      },
    },
    {
      id: "schema-documentation",
      name: "Table/column documentation",
      description:
        "Tables and columns carry descriptions (dbt schema.yml `description:` fields, DDL COMMENT clauses, or a data dictionary).",
      pillarId: "data-health",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const schemaFiles = await fg(["**/schema.yml", "**/schema.yaml", "**/*.schema.yml"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**", "dbt_packages/**"],
        });
        for (const file of schemaFiles) {
          const content = await readFileContent(repoPath, file);
          if (content && content.includes("description:")) {
            return {
              criterionId: "schema-documentation",
              pass: true,
              message: `Column/table descriptions found in ${file}`,
            };
          }
        }

        const ddlFiles = await fg(["**/*.ddl", "**/ddl/**/*.sql", "**/*.sql"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**", "**/tests/**"],
        });
        for (const file of ddlFiles.slice(0, 50)) {
          const content = await readFileContent(repoPath, file);
          if (content && /\bCOMMENT\s+['"]/i.test(content)) {
            return {
              criterionId: "schema-documentation",
              pass: true,
              message: `Column COMMENT clauses found in ${file}`,
            };
          }
        }

        const dictFound = await fileExists(
          repoPath,
          "docs/data-dictionary*",
          "DATA_DICTIONARY.md",
        );
        if (dictFound) {
          return {
            criterionId: "schema-documentation",
            pass: true,
            message: `Data dictionary found: ${dictFound}`,
          };
        }

        return {
          criterionId: "schema-documentation",
          pass: false,
          message: "No table/column documentation found.",
          details:
            "Add `description:` fields to dbt schema.yml, COMMENT clauses in DDL, or a docs/data-dictionary.",
        };
      },
    },
    {
      id: "pii-classification",
      name: "PII/compliance classification declared",
      description:
        "Sensitive columns or tables are explicitly classified (dbt meta `pii:` tags, DDL classification comments, or a data-classification config).",
      pillarId: "data-health",
      level: 3,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const schemaFiles = await fg(["**/schema.yml", "**/schema.yaml", "**/*.schema.yml"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**", "dbt_packages/**"],
        });
        for (const file of schemaFiles) {
          const content = await readFileContent(repoPath, file);
          if (content && /\b(pii|is_pi|sensitive|classification)\s*:/i.test(content)) {
            return {
              criterionId: "pii-classification",
              pass: true,
              message: `PII/classification metadata found in ${file}`,
            };
          }
        }

        const classificationFound = await fileExists(
          repoPath,
          "*.pii.yml",
          "data-classification.yml",
          "data-classification.yaml",
        );
        if (classificationFound) {
          return {
            criterionId: "pii-classification",
            pass: true,
            message: `Data classification config found: ${classificationFound}`,
          };
        }

        const ddlFiles = await fg(["**/*.ddl", "**/ddl/**/*.sql"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**"],
        });
        for (const file of ddlFiles.slice(0, 50)) {
          const content = await readFileContent(repoPath, file);
          if (content && /\b(pii|is_secure|sensitive)\b/i.test(content)) {
            return {
              criterionId: "pii-classification",
              pass: true,
              message: `PII/sensitivity declaration found in ${file}`,
            };
          }
        }

        return {
          criterionId: "pii-classification",
          pass: false,
          message: "No PII/compliance classification found.",
          details:
            "Tag sensitive columns with dbt meta (`pii: true`), DDL comments, or a data-classification.yml.",
        };
      },
    },
    {
      id: "key-constraints-declared",
      name: "Primary/foreign keys declared and tested",
      description:
        "Tables declare primary/foreign keys and those keys are backed by uniqueness/relationship tests (dbt `unique`/`not_null`/`relationships`, DDL PRIMARY KEY/FOREIGN KEY, or Great Expectations key expectations).",
      pillarId: "data-health",
      level: 4,
      requiresLLM: false,
      check: async (repoPath, _projectInfo) => {
        const schemaFiles = await fg(["**/schema.yml", "**/schema.yaml", "**/*.schema.yml"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**", "dbt_packages/**"],
        });
        for (const file of schemaFiles) {
          const content = await readFileContent(repoPath, file);
          if (content && /\b(unique|relationships)\s*:/.test(content)) {
            return {
              criterionId: "key-constraints-declared",
              pass: true,
              message: `Key tests found in ${file}`,
            };
          }
        }

        const ddlFiles = await fg(["**/*.ddl", "**/ddl/**/*.sql"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**"],
        });
        for (const file of ddlFiles.slice(0, 50)) {
          const content = await readFileContent(repoPath, file);
          if (content && /\b(PRIMARY KEY|FOREIGN KEY)\b/i.test(content)) {
            return {
              criterionId: "key-constraints-declared",
              pass: true,
              message: `Key declaration found in ${file}`,
            };
          }
        }

        const geExpectations = await fg(["**/great_expectations/**/*.json"], {
          cwd: repoPath,
          absolute: false,
        });
        for (const file of geExpectations.slice(0, 50)) {
          const content = await readFileContent(repoPath, file);
          if (content && content.includes("expect_column_values_to_be_unique")) {
            return {
              criterionId: "key-constraints-declared",
              pass: true,
              message: `Key expectation found in ${file}`,
            };
          }
        }

        return {
          criterionId: "key-constraints-declared",
          pass: false,
          message: "No declared or tested primary/foreign keys found.",
          details:
            "Add dbt `unique`/`not_null`/`relationships` tests, DDL PRIMARY KEY/FOREIGN KEY declarations, or Great Expectations key checks.",
        };
      },
    },
    {
      id: "data-model-docs-quality",
      name: "Data model documentation quality (AI)",
      description:
        "Documentation for data models/tables is detailed enough for an agent to safely query or extend the pipeline.",
      pillarId: "data-health",
      level: 5,
      requiresLLM: true,
      check: async (repoPath, _projectInfo, llmClient) => {
        if (!llmClient) {
          return {
            criterionId: "data-model-docs-quality",
            pass: false,
            message: "Unable to evaluate data model documentation quality.",
          };
        }

        const schemaFiles = await fg(["**/schema.yml", "**/schema.yaml", "**/*.schema.yml"], {
          cwd: repoPath,
          absolute: false,
          ignore: ["node_modules/**", "dbt_packages/**"],
        });

        if (schemaFiles.length === 0) {
          return {
            criterionId: "data-model-docs-quality",
            pass: false,
            message: "No data model schema files found to evaluate.",
          };
        }

        const snippets: string[] = [];
        for (const file of schemaFiles.slice(0, 5)) {
          const content = await readFileContent(repoPath, file);
          if (content) {
            snippets.push(`--- ${file} ---\n${content.slice(0, 3000)}`);
          }
        }

        return llmClient.evaluate(
          "Evaluate these data model schema files for agent-friendliness. Good data documentation should: describe what each table represents, document column meanings and units, note freshness/update cadence, flag sensitive/PII columns, and describe primary/foreign key relationships. Is this sufficient for an AI agent to safely query or extend the pipeline without guessing?",
          snippets.join("\n\n"),
        ).then((r) => ({ ...r, criterionId: "data-model-docs-quality" }));
      },
    },
  ],
};

export default dataHealth;
