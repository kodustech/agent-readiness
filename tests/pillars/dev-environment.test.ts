import { describe, test, expect, afterEach } from "bun:test";
import devEnvironment from "../../src/pillars/dev-environment.js";
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

const lockFileCheck = getCheck(devEnvironment, "lock-file");
const versionPinnedCheck = getCheck(devEnvironment, "version-pinned");
const setupScriptCheck = getCheck(devEnvironment, "setup-script");

// ---------------------------------------------------------------------------
// lock-file
// ---------------------------------------------------------------------------
describe("lock-file", () => {
  test("csharp: packages.lock.json", async () => {
    const dir = await make("cs-lock", { "packages.lock.json": "{}" });
    const r = await lockFileCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: Gemfile.lock", async () => {
    const dir = await make("rb-lock", { "Gemfile.lock": "GEM\n  specs:" });
    const r = await lockFileCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("php: composer.lock", async () => {
    const dir = await make("php-lock", { "composer.lock": '{"packages":[]}' });
    const r = await lockFileCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("swift: Package.resolved", async () => {
    const dir = await make("swift-lock", { "Package.resolved": '{"pins":[]}' });
    const r = await lockFileCheck(dir, mockProjectInfo({ detectedTypes: ["swift"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("lock-empty");
    const r = await lockFileCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// version-pinned
// ---------------------------------------------------------------------------
describe("version-pinned", () => {
  test("ruby: .ruby-version", async () => {
    const dir = await make("rb-ver", { ".ruby-version": "3.2.2" });
    const r = await versionPinnedCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("php: .php-version", async () => {
    const dir = await make("php-ver", { ".php-version": "8.3" });
    const r = await versionPinnedCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("swift: .swift-version", async () => {
    const dir = await make("swift-ver", { ".swift-version": "5.9" });
    const r = await versionPinnedCheck(dir, mockProjectInfo({ detectedTypes: ["swift"] }));
    expect(r.pass).toBe(true);
  });

  test("csharp: global.json", async () => {
    const dir = await make("cs-ver", { "global.json": '{"sdk":{"version":"8.0.100"}}' });
    const r = await versionPinnedCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("ver-empty");
    const r = await versionPinnedCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setup-script
// ---------------------------------------------------------------------------
describe("setup-script", () => {
  test("csharp: .sln implies dotnet build", async () => {
    const dir = await make("cs-setup", { "App.sln": "Microsoft Visual Studio Solution File" });
    const r = await setupScriptCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: Rakefile", async () => {
    const dir = await make("rb-setup", { Rakefile: "task :default" });
    const r = await setupScriptCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("setup-empty");
    const r = await setupScriptCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});
