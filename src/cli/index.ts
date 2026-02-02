import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";
import ora from "ora";
import chalk from "chalk";
import { version, description } from "../../package.json";
import type { CLIOptions, Pillar, ReportData } from "../types/index.js";
import { detectProject } from "../engine/detector.js";
import { AnalysisEngine } from "../engine/analyzer.js";
import { calculatePillarScores, calculateLevel } from "../engine/scorer.js";
import { generateRecommendations } from "../engine/recommender.js";
import { ALL_PILLARS } from "../pillars/index.js";
import { renderReport } from "../renderer/index.js";
import { loadConfig, generateDefaultConfig } from "../engine/config.js";
import { createLLMClient } from "../engine/llm-client.js";
import { serializeReport } from "../engine/serializer.js";
import { startServer, openBrowser } from "../server/index.js";

/**
 * Main orchestration function.
 * Resolves the repo, runs the full analysis pipeline, and renders the report.
 */
async function main(options: CLIOptions): Promise<void> {
  // --no-color: disable chalk colours
  if (options.noColor) {
    chalk.level = 0;
  }

  // Determine whether the spinner should be active
  const isCI = options.ci || process.env.CI === "true";
  const isJSON = options.format === "json";

  const spinner = ora({
    isEnabled: !isCI && !isJSON,
    isSilent: isJSON,
  });

  try {
    // a. Resolve the repo path to an absolute path
    const repoPath = path.resolve(options.path);

    // b. Check that the path exists
    try {
      await fs.access(repoPath);
    } catch {
      console.error(chalk.red(`Error: path does not exist: ${repoPath}`));
      process.exit(1);
    }

    // Handle --init: generate config file and exit
    if (options.init) {
      const configPath = path.join(repoPath, ".kodus-readiness.yml");
      try {
        await fs.access(configPath);
        console.error(
          chalk.yellow(`Config file already exists: ${configPath}`),
        );
        process.exit(1);
      } catch {
        // File doesn't exist, good to create
      }
      await fs.writeFile(configPath, generateDefaultConfig(), "utf-8");
      console.log(
        chalk.green(`Created config file: ${configPath}`),
      );
      return;
    }

    // c. Get the repo name from path.basename
    const repoName = path.basename(repoPath);

    // Load config file
    const config = await loadConfig(repoPath);

    // Resolve AI settings: CLI flags override config, env var as fallback
    const aiEnabled = options.ai || config.aiEnabled || false;
    const apiKey =
      options.apiKey || config.apiKey || process.env.KODUS_API_KEY || process.env.OPENAI_API_KEY;

    // Create LLM client if AI is enabled
    const llmClient =
      aiEnabled && apiKey
        ? createLLMClient({ apiKey, apiBaseUrl: config.apiBaseUrl })
        : undefined;

    if (aiEnabled && !apiKey) {
      console.warn(
        chalk.yellow(
          "Warning: --ai flag is set but no API key found. Set --api-key, KODUS_API_KEY, or OPENAI_API_KEY env variable.",
        ),
      );
    }

    // Filter pillars and criteria based on config
    let pillars: Pillar[] = ALL_PILLARS;
    if (config.pillars) {
      pillars = pillars.filter((p) => config.pillars![p.id] !== false);
    }
    if (config.criteria) {
      pillars = pillars.map((p) => ({
        ...p,
        criteria: p.criteria.filter(
          (c) => config.criteria![c.id] !== false,
        ),
      }));
    }

    // d. Start spinner: "Detecting project type..."
    spinner.start("Detecting project type...");

    // e. Run detectProject
    const projectInfo = await detectProject(repoPath);

    // f-g. Create AnalysisEngine with filtered pillars and spinner callbacks
    const engine = new AnalysisEngine(pillars, repoPath, projectInfo, {
      aiEnabled,
      llmClient,
      onPillarStart: (pillar) => {
        spinner.text = `Analyzing ${pillar.name}...`;
      },
      onPillarComplete: (_pillar, _results) => {
        // spinner text is updated on next pillar start
      },
    });

    // h. Run engine to get results
    const results = await engine.run();

    // i. Calculate pillar scores
    const pillarScores = calculatePillarScores(pillars, results);

    // j. Calculate level result
    const levelResult = calculateLevel(pillars, results);

    // k. Generate recommendations
    const recommendations = generateRecommendations(
      pillars,
      results,
      pillarScores,
      levelResult,
    );

    // l. Stop spinner
    spinner.stop();

    // m. Build ReportData object
    const reportData: ReportData = {
      repoName,
      repoPath,
      projectInfo,
      pillars,
      results,
      levelResult,
      pillarScores,
      recommendations,
    };

    // n-o. Output report
    if (options.format === "json") {
      const jsonPayload = serializeReport(reportData);
      console.log(JSON.stringify(jsonPayload, null, 2));
    } else {
      renderReport(reportData, { noColor: options.noColor, ci: isCI });
    }

    // p. If --web flag is set, start the dashboard server
    if (options.web) {
      const serialized = serializeReport(reportData);
      try {
        const { url } = await startServer(serialized);
        console.log("");
        console.log(
          chalk.bold.cyan("  Dashboard: ") + chalk.underline(url),
        );
        console.log(chalk.dim("  Press Ctrl+C to stop the server."));
        console.log("");
        await openBrowser(url);
        // Block until the process is killed
        await new Promise(() => {});
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\nFailed to start web dashboard: ${msg}`));
      }
    }

    // q. If --min-level is set and level is below threshold, exit with code 1
    if (
      options.minLevel !== undefined &&
      levelResult.level < options.minLevel
    ) {
      process.exit(1);
    }
  } catch (error) {
    spinner.stop();
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Error: ${message}`));
    process.exit(1);
  }
}

/**
 * Set up the Commander program, parse argv, and invoke main().
 */
export function run(): void {
  const program = new Command();

  program
    .name("kodus-agent-readiness")
    .description(description)
    .version(version)
    .argument("[path]", "Path to the repository to evaluate", process.cwd())
    .option("--ai", "Enable AI-powered criteria evaluation", false)
    .option("--api-key <key>", "API key for AI evaluations")
    .option("--ci", "Run in CI mode (non-interactive, exit code reflects level)", false)
    .option("--format <format>", "Output format (text or json)", "text")
    .option("--min-level <n>", "Minimum maturity level to pass (1-5)")
    .option("--no-color", "Disable colored output")
    .option("--init", "Generate a .kodus-readiness.yml config file", false)
    .option("--no-web", "Disable the web dashboard")
    .action(async (pathArg: string, opts: Record<string, unknown>) => {
      const cliOptions: CLIOptions = {
        path: pathArg,
        ai: Boolean(opts.ai),
        apiKey: opts.apiKey as string | undefined,
        ci: Boolean(opts.ci),
        format: (opts.format as "text" | "json") ?? "text",
        minLevel: opts.minLevel !== undefined ? Number(opts.minLevel) : undefined,
        noColor: !opts.color,
        init: Boolean(opts.init),
        web: opts.web !== false,
      };

      await main(cliOptions);
    });

  program.parse();
}
