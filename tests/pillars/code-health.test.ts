import { describe, test, expect, afterEach } from "bun:test";
import codeHealth from "../../src/pillars/code-health.js";
import {
  createTestDir,
  cleanup,
  writeFixtures,
  mockProjectInfo,
  getCheck,
} from "../helpers.js";

let dirs: string[] = [];

async function make(name: string, fixtures: Record<string, string> = {}) {
  const dir = await createTestDir(name);
  dirs.push(dir);
  if (Object.keys(fixtures).length > 0) {
    await writeFixtures(dir, fixtures);
  }
  return dir;
}

afterEach(async () => {
  for (const d of dirs) await cleanup(d);
  dirs = [];
});

const freshnessCheck = getCheck(codeHealth, "no-outdated-deps");
const deadCodeCheck = getCheck(codeHealth, "dead-code-detection");

// ---------------------------------------------------------------------------
// no-outdated-deps — new lock files recognized
// ---------------------------------------------------------------------------
describe("no-outdated-deps", () => {
  test("csharp: packages.lock.json (fresh)", async () => {
    const dir = await make("cs-fresh", { "packages.lock.json": "{}" });
    const r = await freshnessCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: Gemfile.lock (fresh)", async () => {
    const dir = await make("rb-fresh", { "Gemfile.lock": "GEM\n  specs:" });
    const r = await freshnessCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("php: composer.lock (fresh)", async () => {
    const dir = await make("php-fresh", { "composer.lock": '{"packages":[]}' });
    const r = await freshnessCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("swift: Package.resolved (fresh)", async () => {
    const dir = await make("swift-fresh", { "Package.resolved": '{"pins":[]}' });
    const r = await freshnessCheck(dir, mockProjectInfo({ detectedTypes: ["swift"] }));
    expect(r.pass).toBe(true);
  });

  test("manifest without lock file fails", async () => {
    const dir = await make("no-lock", { "composer.json": '{"require":{}}' });
    const r = await freshnessCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(false);
  });

  test("empty dir skips", async () => {
    const dir = await make("fresh-empty");
    const r = await freshnessCheck(dir, mockProjectInfo());
    expect(r.skipped).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// dead-code-detection
// ---------------------------------------------------------------------------
describe("dead-code-detection", () => {
  test("csharp: Roslynator in .csproj", async () => {
    const dir = await make("cs-dead", {
      "App.csproj": '<PackageReference Include="Roslynator.Analyzers" />',
    });
    const r = await deadCodeCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: debride in Gemfile", async () => {
    const dir = await make("rb-dead-debride", { Gemfile: 'gem "debride"' });
    const r = await deadCodeCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: reek in Gemfile", async () => {
    const dir = await make("rb-dead-reek", { Gemfile: 'gem "reek"' });
    const r = await deadCodeCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("php: phpmd in composer.json", async () => {
    const dir = await make("php-dead", {
      "composer.json": '{"require-dev":{"phpmd/phpmd":"^2.0"}}',
    });
    const r = await deadCodeCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("dead-empty");
    const r = await deadCodeCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});
