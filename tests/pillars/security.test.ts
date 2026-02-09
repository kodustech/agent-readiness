import { describe, test, expect, afterEach } from "bun:test";
import security from "../../src/pillars/security.js";
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

const securityScanningCheck = getCheck(security, "security-scanning");

// ---------------------------------------------------------------------------
// security-scanning
// ---------------------------------------------------------------------------
describe("security-scanning", () => {
  test("csharp: SecurityCodeScan in .csproj", async () => {
    const dir = await make("cs-sec", {
      "App.csproj": '<PackageReference Include="SecurityCodeScan.VS2019" />',
    });
    const r = await securityScanningCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: brakeman in Gemfile", async () => {
    const dir = await make("rb-sec", { Gemfile: 'gem "brakeman"' });
    const r = await securityScanningCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("php: roave/security-advisories in composer.json", async () => {
    const dir = await make("php-sec", {
      "composer.json": '{"require-dev":{"roave/security-advisories":"dev-latest"}}',
    });
    const r = await securityScanningCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("sec-empty");
    const r = await securityScanningCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});
