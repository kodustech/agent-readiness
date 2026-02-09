import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import type { ProjectInfo, Pillar } from "../src/types/index.js";

export async function createTestDir(name: string): Promise<string> {
  const dir = path.join(os.tmpdir(), `agent-readiness-test-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function cleanup(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

export async function writeFixtures(
  dir: string,
  fixtures: Record<string, string>,
): Promise<void> {
  for (const [filePath, content] of Object.entries(fixtures)) {
    const full = path.join(dir, filePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, "utf-8");
  }
}

export function mockProjectInfo(overrides?: Partial<ProjectInfo>): ProjectInfo {
  return {
    detectedTypes: [],
    isMonorepo: false,
    packages: [],
    ...overrides,
  };
}

export function getCheck(pillar: Pillar, criterionId: string) {
  const criterion = pillar.criteria.find((c) => c.id === criterionId);
  if (!criterion) {
    throw new Error(`Criterion "${criterionId}" not found in pillar "${pillar.id}"`);
  }
  return criterion.check;
}
