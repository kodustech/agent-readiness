import chalk from "chalk";
import boxen from "boxen";
import Table from "cli-table3";
import type {
  ReportData,
  RenderOptions,
  PillarScore,
  Pillar,
  MaturityLevel,
} from "../types/index.js";
import { LEVEL_LABELS } from "../types/index.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function progressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty);
  if (percentage >= 80) return chalk.green(bar);
  if (percentage >= 50) return chalk.yellow(bar);
  return chalk.red(bar);
}

function plainProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return "#".repeat(filled) + "-".repeat(empty);
}

function getLevelColor(level: MaturityLevel): typeof chalk {
  switch (level) {
    case 1:
      return chalk.red;
    case 2:
      return chalk.yellow;
    case 3:
      return chalk.green;
    case 4:
      return chalk.blue;
    case 5:
      return chalk.magenta;
  }
}

function getLevelBorderColor(
  level: MaturityLevel,
): "red" | "yellow" | "green" | "blue" | "magenta" {
  switch (level) {
    case 1:
      return "red";
    case 2:
      return "yellow";
    case 3:
      return "green";
    case 4:
      return "blue";
    case 5:
      return "magenta";
  }
}

function getEffortBadge(effort: "low" | "medium" | "high"): string {
  switch (effort) {
    case "low":
      return chalk.bgGreen.black.bold(" LOW ");
    case "medium":
      return chalk.bgYellow.black.bold(" MED ");
    case "high":
      return chalk.bgRed.white.bold(" HIGH ");
  }
}

function findPillar(pillars: Pillar[], pillarId: string): Pillar | undefined {
  return pillars.find((p) => p.id === pillarId);
}

function overallPercentage(pillarScores: PillarScore[]): number {
  if (pillarScores.length === 0) return 0;
  const totalPassed = pillarScores.reduce((sum, s) => sum + s.passed, 0);
  const totalCriteria = pillarScores.reduce((sum, s) => sum + s.total, 0);
  if (totalCriteria === 0) return 0;
  return Math.round((totalPassed / totalCriteria) * 100);
}

// ─── Section Renderers ──────────────────────────────────────────────────────

function renderHeader(data: ReportData, ci: boolean): void {
  const types =
    data.projectInfo.detectedTypes.length > 0
      ? data.projectInfo.detectedTypes.join(", ")
      : "unknown";
  const monorepoTag = data.projectInfo.isMonorepo
    ? chalk.cyan(" [monorepo]")
    : "";

  if (ci) {
    console.log("=== KODUS AGENT READINESS ===");
    console.log(`Repository: ${data.repoName}`);
    console.log(`Path: ${data.repoPath}`);
    console.log(
      `Project types: ${types}${data.projectInfo.isMonorepo ? " [monorepo]" : ""}`,
    );
    console.log("");
    return;
  }

  const title = chalk.bold.white("KODUS AGENT READINESS");
  const subtitle = chalk.gray(`${data.repoName}  ${chalk.dim(data.repoPath)}`);
  const projectLine =
    chalk.white("Project: ") + chalk.cyan.bold(types) + monorepoTag;

  const packagesLine =
    data.projectInfo.isMonorepo && data.projectInfo.packages.length > 0
      ? "\n" +
        chalk.white("Packages: ") +
        chalk.dim(data.projectInfo.packages.slice(0, 5).join(", ")) +
        (data.projectInfo.packages.length > 5
          ? chalk.dim(` +${data.projectInfo.packages.length - 5} more`)
          : "")
      : "";

  const content = `${title}\n${subtitle}\n\n${projectLine}${packagesLine}`;

  console.log(
    boxen(content, {
      borderStyle: "doubleSingle",
      padding: { top: 1, bottom: 1, left: 3, right: 3 },
      margin: { top: 1, bottom: 0, left: 0, right: 0 },
      borderColor: "cyan",
      textAlignment: "center",
    }),
  );
}

function renderLevelBadge(data: ReportData, ci: boolean): void {
  const { level, nextLevelProgress } = data.levelResult;
  const label = LEVEL_LABELS[level];
  const overall = overallPercentage(data.pillarScores);

  if (ci) {
    console.log(`Level: ${level} - ${label}`);
    if (nextLevelProgress.nextLevel !== null) {
      console.log(
        `Progress: ${nextLevelProgress.remaining} more criteria to reach Level ${nextLevelProgress.nextLevel}`,
      );
    }
    console.log(`Overall: ${plainProgressBar(overall)} ${overall}%`);
    console.log("");
    return;
  }

  const colorFn = getLevelColor(level);
  const borderColor = getLevelBorderColor(level);

  const levelText = colorFn.bold(
    `  LEVEL ${level}  ${chalk.dim("\u2014")}  ${label}  `,
  );

  let progressLine = "";
  if (nextLevelProgress.nextLevel !== null) {
    progressLine =
      "\n" +
      chalk.dim(
        `${nextLevelProgress.remaining} more criteria to reach Level ${nextLevelProgress.nextLevel}`,
      );
  } else {
    progressLine = "\n" + chalk.green.bold("Maximum level achieved!");
  }

  const overallLine = `\n\n${chalk.white("Overall Score  ")}${progressBar(overall)}  ${chalk.bold.white(`${overall}%`)}`;

  const content = levelText + progressLine + overallLine;

  console.log(
    boxen(content, {
      borderStyle: "round",
      padding: { top: 1, bottom: 1, left: 2, right: 2 },
      margin: { top: 1, bottom: 0, left: 0, right: 0 },
      borderColor,
      textAlignment: "center",
    }),
  );
}

function renderPillarSummary(data: ReportData, ci: boolean): void {
  if (ci) {
    console.log("--- Pillar Summary ---");
    for (const score of data.pillarScores) {
      const pillar = findPillar(data.pillars, score.pillarId);
      const name = pillar ? pillar.name : score.pillarId;
      console.log(
        `  ${name}: ${plainProgressBar(score.percentage, 15)} ${score.percentage}% (${score.passed}/${score.total})`,
      );
    }
    console.log("");
    return;
  }

  console.log("");
  console.log(
    chalk.bold.white("  \u250C\u2500 ") +
      chalk.bold.cyan("PILLAR SUMMARY") +
      chalk.bold.white(" \u2500".repeat(40)),
  );
  console.log("");

  const table = new Table({
    chars: {
      top: "\u2500",
      "top-mid": "\u252C",
      "top-left": "\u250C",
      "top-right": "\u2510",
      bottom: "\u2500",
      "bottom-mid": "\u2534",
      "bottom-left": "\u2514",
      "bottom-right": "\u2518",
      left: "\u2502",
      "left-mid": "\u251C",
      mid: "\u2500",
      "mid-mid": "\u253C",
      right: "\u2502",
      "right-mid": "\u2524",
      middle: "\u2502",
    },
    style: {
      head: [],
      border: [],
      "padding-left": 1,
      "padding-right": 1,
    },
    head: [
      chalk.bold.cyan("Pillar"),
      chalk.bold.cyan("Score"),
      chalk.bold.cyan("%"),
      chalk.bold.cyan("Pass/Total"),
    ],
    colWidths: [30, 24, 8, 12],
  });

  for (const score of data.pillarScores) {
    const pillar = findPillar(data.pillars, score.pillarId);
    const icon = pillar ? pillar.icon : "\u2022";
    const name = pillar ? pillar.name : score.pillarId;

    const percentStr =
      score.percentage >= 80
        ? chalk.green.bold(`${score.percentage}%`)
        : score.percentage >= 50
          ? chalk.yellow.bold(`${score.percentage}%`)
          : chalk.red.bold(`${score.percentage}%`);

    const passTotal = chalk.white(`${score.passed}/${score.total}`);

    table.push([
      `${icon}  ${chalk.white(name)}`,
      progressBar(score.percentage, 18),
      percentStr,
      passTotal,
    ]);
  }

  console.log(table.toString());
}

function renderDetailedBreakdown(data: ReportData, ci: boolean): void {
  console.log("");

  if (ci) {
    console.log("--- Detailed Breakdown ---");
    for (const pillar of data.pillars) {
      const results = data.results.get(pillar.id) || [];
      const passed = results.filter((r) => r.pass && !r.skipped).length;
      const total = results.length;
      console.log(`\n  ${pillar.name} (${passed}/${total} passing)`);
      for (const r of results) {
        const icon = r.skipped ? "o" : r.pass ? "+" : "-";
        const suffix = r.skipped ? " (requires --ai)" : "";
        console.log(`    [${icon}] ${r.message}${suffix}`);
        if (!r.pass && !r.skipped && r.details) {
          console.log(`        ${r.details}`);
        }
      }
    }
    console.log("");
    return;
  }

  console.log(
    chalk.bold.white("  \u250C\u2500 ") +
      chalk.bold.cyan("DETAILED BREAKDOWN") +
      chalk.bold.white(" \u2500".repeat(38)),
  );

  for (const pillar of data.pillars) {
    const results = data.results.get(pillar.id) || [];
    const passed = results.filter((r) => r.pass && !r.skipped).length;
    const total = results.length;

    console.log("");
    console.log(
      `  ${pillar.icon}  ${chalk.bold.white(pillar.name)}  ${chalk.dim("\u2500\u2500\u2500")}  ${chalk.dim(`${passed}/${total} passing`)}`,
    );
    console.log("");

    for (const r of results) {
      if (r.skipped) {
        const icon = chalk.cyan("\u25CB");
        console.log(
          `    ${icon}  ${chalk.dim(r.message)}  ${chalk.cyan.dim("(requires --ai)")}`,
        );
      } else if (r.pass) {
        const icon = chalk.green.bold("\u2713");
        console.log(`    ${icon}  ${chalk.white(r.message)}`);
      } else {
        const icon = chalk.red.bold("\u2717");
        console.log(`    ${icon}  ${chalk.white(r.message)}`);
        if (r.details) {
          const detailLines = r.details.split("\n");
          for (const line of detailLines) {
            console.log(`       ${chalk.dim(line)}`);
          }
        }
      }
    }

    console.log("");
    console.log(chalk.dim("  " + "\u2500".repeat(56)));
  }
}

function renderRecommendations(data: ReportData, ci: boolean): void {
  console.log("");

  if (ci) {
    if (data.recommendations.length === 0) {
      console.log("--- Recommendations ---");
      console.log("  All checks passing! Your repo is agent-ready.");
      console.log("");
      return;
    }
    console.log("--- Top Recommendations ---");
    data.recommendations.forEach((rec, i) => {
      const pillar = findPillar(data.pillars, rec.pillarId);
      const pillarName = pillar ? pillar.name : rec.pillarId;
      console.log(
        `  ${i + 1}. ${rec.title} [${rec.effort}] [${pillarName}]`,
      );
      console.log(`     ${rec.description}`);
      if (rec.reason) {
        console.log(`     Reason: ${rec.reason}`);
      }
    });
    console.log("");
    return;
  }

  if (data.recommendations.length === 0) {
    const content =
      chalk.green.bold("\u2728  All checks passing!") +
      "\n\n" +
      chalk.white("Your repository is fully agent-ready. Congratulations!");

    console.log(
      boxen(content, {
        borderStyle: "round",
        padding: { top: 1, bottom: 1, left: 3, right: 3 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        borderColor: "green",
        textAlignment: "center",
      }),
    );
    return;
  }

  console.log(
    chalk.bold.white("  \u250C\u2500 ") +
      chalk.bold.cyan("TOP RECOMMENDATIONS") +
      chalk.bold.white(" \u2500".repeat(37)),
  );
  console.log("");

  data.recommendations.forEach((rec, i) => {
    const pillar = findPillar(data.pillars, rec.pillarId);
    const pillarName = pillar ? pillar.name : rec.pillarId;

    const number = chalk.bold.cyan(`  ${i + 1}.`);
    const title = chalk.bold.white(rec.title);
    const effortBadge = getEffortBadge(rec.effort);
    const pillarTag = chalk.dim(`[${pillarName}]`);

    console.log(`${number} ${title}  ${effortBadge}  ${pillarTag}`);
    console.log(`     ${chalk.white(rec.description)}`);
    if (rec.reason) {
      console.log(`     ${chalk.dim(rec.reason)}`);
    }
    console.log("");
  });
}

function renderFooter(data: ReportData, ci: boolean): void {
  if (ci) {
    console.log("---");
    console.log("Powered by Kodus | https://kodus.io");
    console.log("");
    return;
  }

  console.log("");

  const hasSkipped = Array.from(data.results.values()).some((results) =>
    results.some((r) => r.skipped),
  );

  const lines: string[] = [];

  if (hasSkipped) {
    lines.push(
      chalk.yellow("\u26A1") +
        chalk.dim("  Run with ") +
        chalk.yellow.bold("--ai") +
        chalk.dim(" for deeper analysis with LLM-powered checks"),
    );
  }

  lines.push("");
  lines.push(
    chalk.dim("  Powered by ") +
      chalk.bold.cyan("Kodus") +
      chalk.dim("  \u2022  https://kodus.io"),
  );

  console.log(lines.join("\n"));
  console.log("");
}

// ─── Main Export ────────────────────────────────────────────────────────────

export function renderReport(data: ReportData, options: RenderOptions): void {
  if (options.noColor) {
    chalk.level = 0;
  }

  const ci = options.ci;

  renderHeader(data, ci);
  renderLevelBadge(data, ci);
  renderPillarSummary(data, ci);
  renderDetailedBreakdown(data, ci);
  renderRecommendations(data, ci);
  renderFooter(data, ci);
}
