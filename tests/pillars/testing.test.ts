import { describe, test, expect, afterEach } from "bun:test";
import testing from "../../src/pillars/testing.js";
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

const frameworkCheck = getCheck(testing, "test-framework");
const filesCheck = getCheck(testing, "test-files-exist");
const scriptCheck = getCheck(testing, "test-script");
const coverageCheck = getCheck(testing, "coverage-config");

// ---------------------------------------------------------------------------
// test-framework
// ---------------------------------------------------------------------------
describe("test-framework", () => {
  test("csharp: xunit in .csproj", async () => {
    const dir = await make("cs-fw", {
      "Tests.csproj": '<PackageReference Include="xunit" Version="2.6" />',
    });
    const r = await frameworkCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: .rspec file", async () => {
    const dir = await make("rb-fw", { ".rspec": "--color" });
    const r = await frameworkCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("php: phpunit.xml", async () => {
    const dir = await make("php-fw", { "phpunit.xml": "<phpunit />" });
    const r = await frameworkCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("swift: Package.swift + Tests/", async () => {
    const dir = await make("swift-fw", {
      "Package.swift": "// swift-tools-version:5.9",
      "Tests/MyTests/MyTests.swift": "import XCTest",
    });
    const r = await frameworkCheck(dir, mockProjectInfo({ detectedTypes: ["swift"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("fw-empty");
    const r = await frameworkCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// test-files-exist
// ---------------------------------------------------------------------------
describe("test-files-exist", () => {
  test("csharp: FooTest.cs", async () => {
    const dir = await make("cs-files", { "FooTest.cs": "class FooTest {}" });
    const r = await filesCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: foo_spec.rb", async () => {
    const dir = await make("rb-files", { "spec/foo_spec.rb": "describe Foo do; end" });
    const r = await filesCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("php: FooTest.php", async () => {
    const dir = await make("php-files", { "tests/FooTest.php": "class FooTest {}" });
    const r = await filesCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("swift: FooTests.swift", async () => {
    const dir = await make("swift-files", { "Tests/FooTests.swift": "import XCTest" });
    const r = await filesCheck(dir, mockProjectInfo({ detectedTypes: ["swift"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("files-empty");
    const r = await filesCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// test-script
// ---------------------------------------------------------------------------
describe("test-script", () => {
  test("csharp: .sln implies dotnet test", async () => {
    const dir = await make("cs-script", { "App.sln": "Microsoft Visual Studio Solution File" });
    const r = await scriptCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: Rakefile", async () => {
    const dir = await make("rb-script", { Rakefile: "task :test" });
    const r = await scriptCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("php: composer.json scripts.test", async () => {
    const dir = await make("php-script", {
      "composer.json": '{"scripts":{"test":"phpunit"}}',
    });
    const r = await scriptCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("swift: Package.swift", async () => {
    const dir = await make("swift-script", { "Package.swift": "// swift-tools-version:5.9" });
    const r = await scriptCheck(dir, mockProjectInfo({ detectedTypes: ["swift"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("script-empty");
    const r = await scriptCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// coverage-config
// ---------------------------------------------------------------------------
describe("coverage-config", () => {
  test("csharp: coverlet in .csproj", async () => {
    const dir = await make("cs-cov", {
      "Tests.csproj": '<PackageReference Include="coverlet.collector" />',
    });
    const r = await coverageCheck(dir, mockProjectInfo({ detectedTypes: ["csharp"] }));
    expect(r.pass).toBe(true);
  });

  test("ruby: simplecov in Gemfile", async () => {
    const dir = await make("rb-cov", { Gemfile: 'gem "simplecov"' });
    const r = await coverageCheck(dir, mockProjectInfo({ detectedTypes: ["ruby"] }));
    expect(r.pass).toBe(true);
  });

  test("php: coverage in phpunit.xml", async () => {
    const dir = await make("php-cov", {
      "phpunit.xml": '<phpunit><coverage><include><directory suffix=".php">src</directory></include></coverage></phpunit>',
    });
    const r = await coverageCheck(dir, mockProjectInfo({ detectedTypes: ["php"] }));
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("cov-empty");
    const r = await coverageCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});
