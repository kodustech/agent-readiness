import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";

export async function fileExists(
  repoPath: string,
  ...patterns: string[]
): Promise<string | null> {
  for (const pattern of patterns) {
    if (pattern.includes("*")) {
      const matches = await fg(pattern, {
        cwd: repoPath,
        absolute: false,
        dot: true,
      });
      if (matches.length > 0) return matches[0];
    } else {
      if (existsSync(join(repoPath, pattern))) return pattern;
    }
  }
  return null;
}

export async function readFileContent(
  repoPath: string,
  filePath: string,
): Promise<string | null> {
  try {
    return await readFile(join(repoPath, filePath), "utf-8");
  } catch {
    return null;
  }
}

export async function packageJsonHas(
  repoPath: string,
  key: string,
): Promise<boolean> {
  const content = await readFileContent(repoPath, "package.json");
  if (!content) return false;
  try {
    const pkg = JSON.parse(content);
    return (
      key.split(".").reduce((obj: Record<string, unknown> | undefined, k) => {
        if (obj === undefined || obj === null) return undefined;
        return obj[k] as Record<string, unknown> | undefined;
      }, pkg as Record<string, unknown>) !== undefined
    );
  } catch {
    return false;
  }
}

export async function getFileMtimeMs(
  repoPath: string,
  filePath: string,
): Promise<number | null> {
  try {
    const s = await stat(join(repoPath, filePath));
    return s.mtimeMs;
  } catch {
    return null;
  }
}
