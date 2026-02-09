import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import type { ProjectInfo } from "../types/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function readYamlFile<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return YAML.parse(content) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Project-type detection
// ---------------------------------------------------------------------------

interface TypeIndicator {
  type: string;
  files: string[];
}

const TYPE_INDICATORS: TypeIndicator[] = [
  { type: "node", files: ["package.json"] },
  { type: "python", files: ["pyproject.toml", "setup.py", "requirements.txt"] },
  { type: "go", files: ["go.mod"] },
  { type: "rust", files: ["Cargo.toml"] },
  { type: "kotlin", files: ["build.gradle.kts"] },
  { type: "java", files: ["pom.xml", "build.gradle"] },
];

async function detectTypes(repoPath: string): Promise<string[]> {
  const detected: string[] = [];

  for (const indicator of TYPE_INDICATORS) {
    for (const file of indicator.files) {
      if (await fileExists(path.join(repoPath, file))) {
        if (!detected.includes(indicator.type)) {
          detected.push(indicator.type);
        }
        break; // one match per type is enough
      }
    }
  }

  // Additional Kotlin detection: check build.gradle for Kotlin plugins
  if (!detected.includes("kotlin")) {
    const buildGradle = path.join(repoPath, "build.gradle");
    if (await fileExists(buildGradle)) {
      try {
        const content = await fs.readFile(buildGradle, "utf-8");
        if (
          content.includes("org.jetbrains.kotlin") ||
          /\bkotlin\s*\(/.test(content) ||
          /id\s+['"]kotlin/.test(content) ||
          content.includes("kotlin-android") ||
          content.includes("kotlin-jvm")
        ) {
          detected.push("kotlin");
        }
      } catch {
        // ignore read errors
      }
    }

    // Check pom.xml for kotlin-maven-plugin
    const pomXml = path.join(repoPath, "pom.xml");
    if (!detected.includes("kotlin") && await fileExists(pomXml)) {
      try {
        const content = await fs.readFile(pomXml, "utf-8");
        if (content.includes("kotlin-maven-plugin") || content.includes("org.jetbrains.kotlin")) {
          detected.push("kotlin");
        }
      } catch {
        // ignore read errors
      }
    }
  }

  return detected;
}

// ---------------------------------------------------------------------------
// Monorepo detection
// ---------------------------------------------------------------------------

interface MonorepoResult {
  isMonorepo: boolean;
  packages: string[];
}

/**
 * Resolve workspace glob patterns into actual directory paths.
 */
async function resolveWorkspaceGlobs(
  repoPath: string,
  patterns: string[],
): Promise<string[]> {
  // Normalise patterns: ensure each one targets directories by appending
  // /package.json so fast-glob only returns real package folders.
  const globPatterns = patterns.map((p) => {
    // Strip trailing slashes and wildcard stars, then append /package.json
    const cleaned = p.replace(/\/?\*?$/, "");
    return `${cleaned}/*/package.json`;
  });

  // Also try the raw patterns directly in case they already point at
  // concrete directories (e.g. "packages/foo").
  const directPatterns = patterns.map((p) => {
    const cleaned = p.replace(/\/?\*?$/, "");
    return `${cleaned}/package.json`;
  });

  const allPatterns = [...globPatterns, ...directPatterns];

  const matches = await fg(allPatterns, {
    cwd: repoPath,
    onlyFiles: true,
    absolute: false,
    unique: true,
  });

  // Return relative directory paths (strip the trailing /package.json)
  const dirs = matches.map((m) => path.dirname(m));

  // De-duplicate and sort for deterministic output
  return [...new Set(dirs)].sort();
}

async function detectMonorepo(repoPath: string): Promise<MonorepoResult> {
  const negative: MonorepoResult = { isMonorepo: false, packages: [] };

  // 1. npm / yarn workspaces -------------------------------------------------
  const pkgJson = await readJsonFile<{
    workspaces?: string[] | { packages?: string[] };
  }>(path.join(repoPath, "package.json"));

  if (pkgJson?.workspaces) {
    const patterns = Array.isArray(pkgJson.workspaces)
      ? pkgJson.workspaces
      : pkgJson.workspaces.packages ?? [];

    if (patterns.length > 0) {
      const packages = await resolveWorkspaceGlobs(repoPath, patterns);
      return { isMonorepo: true, packages };
    }
  }

  // 2. pnpm workspaces -------------------------------------------------------
  const pnpmPath = path.join(repoPath, "pnpm-workspace.yaml");
  if (await fileExists(pnpmPath)) {
    const pnpmConfig = await readYamlFile<{ packages?: string[] }>(pnpmPath);
    const patterns = pnpmConfig?.packages ?? [];

    if (patterns.length > 0) {
      const packages = await resolveWorkspaceGlobs(repoPath, patterns);
      return { isMonorepo: true, packages };
    }

    // Even without explicit patterns, the existence of the file signals a monorepo
    return { isMonorepo: true, packages: [] };
  }

  // 3. Lerna ------------------------------------------------------------------
  const lernaPath = path.join(repoPath, "lerna.json");
  if (await fileExists(lernaPath)) {
    const lernaConfig = await readJsonFile<{ packages?: string[] }>(lernaPath);
    const patterns = lernaConfig?.packages ?? ["packages/*"];
    const packages = await resolveWorkspaceGlobs(repoPath, patterns);
    return { isMonorepo: true, packages };
  }

  // 4. Nx ---------------------------------------------------------------------
  if (await fileExists(path.join(repoPath, "nx.json"))) {
    // Nx projects can live anywhere; try common conventions
    const packages = await resolveWorkspaceGlobs(repoPath, [
      "packages",
      "apps",
      "libs",
    ]);
    return { isMonorepo: true, packages };
  }

  // 5. Turborepo --------------------------------------------------------------
  if (await fileExists(path.join(repoPath, "turbo.json"))) {
    // Turbo relies on the workspace config from the package manager, which
    // we already checked above. If we reach here, just flag as monorepo.
    // Attempt common conventions as a fallback.
    const packages = await resolveWorkspaceGlobs(repoPath, [
      "packages",
      "apps",
    ]);
    return { isMonorepo: true, packages };
  }

  return negative;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function detectProject(repoPath: string): Promise<ProjectInfo> {
  const absolutePath = path.resolve(repoPath);

  const [detectedTypes, monorepo] = await Promise.all([
    detectTypes(absolutePath),
    detectMonorepo(absolutePath),
  ]);

  return {
    detectedTypes,
    isMonorepo: monorepo.isMonorepo,
    packages: monorepo.packages,
  };
}
