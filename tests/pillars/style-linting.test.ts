import { describe, test, expect, afterEach } from "bun:test";
import styleLinting from "../../src/pillars/style-linting.js";
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

const linterCheck = getCheck(styleLinting, "linter");
const formatterCheck = getCheck(styleLinting, "formatter");
const typeCheckerCheck = getCheck(styleLinting, "type-checker");

// ---------------------------------------------------------------------------
// Linter
// ---------------------------------------------------------------------------
describe("linter", () => {
  // C#
  test("csharp: stylecop.json", async () => {
    const dir = await make("cs-lint-stylecop", { "stylecop.json": "{}" });
    const r = await linterCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("csharp: Roslyn analyzers in .csproj", async () => {
    const dir = await make("cs-lint-roslyn", {
      "App.csproj": '<ItemGroup><PackageReference Include="Microsoft.CodeAnalysis" /></ItemGroup>',
    });
    const r = await linterCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  // Ruby
  test("ruby: .rubocop.yml", async () => {
    const dir = await make("rb-lint-rubocop", { ".rubocop.yml": "AllCops:\n  TargetRubyVersion: 3.2" });
    const r = await linterCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: rubocop in Gemfile", async () => {
    const dir = await make("rb-lint-gemfile", { Gemfile: 'gem "rubocop"' });
    const r = await linterCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  // PHP
  test("php: phpstan.neon", async () => {
    const dir = await make("php-lint-phpstan", { "phpstan.neon": "parameters:" });
    const r = await linterCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("php: psalm.xml", async () => {
    const dir = await make("php-lint-psalm", { "psalm.xml": "<psalm />" });
    const r = await linterCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("php: phpcs.xml", async () => {
    const dir = await make("php-lint-phpcs", { "phpcs.xml": "<ruleset />" });
    const r = await linterCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("php: linter in composer.json", async () => {
    const dir = await make("php-lint-composer", {
      "composer.json": '{"require-dev":{"phpstan/phpstan":"^1.0"}}',
    });
    const r = await linterCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  // Swift
  test("swift: .swiftlint.yml", async () => {
    const dir = await make("swift-lint", { ".swiftlint.yml": "disabled_rules:" });
    const r = await linterCheck(dir, mockProjectInfo({ detectedTypes: ["swift"] }));
    expect(r.pass).toBe(true);
  });

  // Fail case
  test("empty dir fails", async () => {
    const dir = await make("lint-empty");
    const r = await linterCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Formatter
// ---------------------------------------------------------------------------
describe("formatter", () => {
  // C# auto-pass
  test("csharp: auto-pass via detectedTypes", async () => {
    const dir = await make("cs-fmt");
    const r = await formatterCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  // Ruby
  test("ruby: .rubocop.yml", async () => {
    const dir = await make("rb-fmt-rubocop", { ".rubocop.yml": "AllCops:" });
    const r = await formatterCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: rubocop in Gemfile", async () => {
    const dir = await make("rb-fmt-gemfile", { Gemfile: 'gem "rubocop"' });
    const r = await formatterCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  // PHP
  test("php: .php-cs-fixer.php", async () => {
    const dir = await make("php-fmt", { ".php-cs-fixer.php": "<?php return [];" });
    const r = await formatterCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  // Swift
  test("swift: .swiftformat", async () => {
    const dir = await make("swift-fmt", { ".swiftformat": "--indent 4" });
    const r = await formatterCheck(dir, mockProjectInfo({ detectedTypes: ["swift"] }));
    expect(r.pass).toBe(true);
  });

  // Fail case
  test("empty dir fails", async () => {
    const dir = await make("fmt-empty");
    const r = await formatterCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Type-checker
// ---------------------------------------------------------------------------
describe("type-checker", () => {
  test("csharp: auto-pass", async () => {
    const dir = await make("cs-tc");
    const r = await typeCheckerCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("swift: auto-pass", async () => {
    const dir = await make("swift-tc");
    const r = await typeCheckerCheck(dir, mockProjectInfo({ detectedTypes: ["swift"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("tc-empty");
    const r = await typeCheckerCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});
