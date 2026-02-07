# @kodus/agent-readiness

[![npm version](https://img.shields.io/npm/v/@kodus/agent-readiness.svg)](https://www.npmjs.com/package/@kodus/agent-readiness)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen.svg)](https://github.com/kodus-ai/agent-readiness)

**The open-source alternative to Factory.ai's Agent Readiness.** Evaluate how ready your codebase is for autonomous AI coding agents.

```bash
bunx @kodus/agent-readiness .
```

---

## Quick Demo

```
$ bunx @kodus/agent-readiness .

  @kodus/agent-readiness v0.1.0

  Repository: my-project
  Project types: node
  ──────────────────────────────────────────

  Maturity Level: 3 - Structured ███████████░░░░░ 65%

  ┌───────────────────────┬────────┬───────┐
  │ Pillar                │ Score  │ Status│
  ├───────────────────────┼────────┼───────┤
  │ 🎨 Style & Linting   │  4/6   │  67%  │
  │ 🧪 Testing           │  3/6   │  50%  │
  │ 📚 Documentation      │  5/8   │  63%  │
  │ 🔧 Dev Environment   │  4/5   │  80%  │
  │ ⚙️  CI/CD             │  4/6   │  67%  │
  │ 💚 Code Health        │  1/3   │  33%  │
  │ 🔒 Security           │  3/5   │  60%  │
  └───────────────────────┴────────┴───────┘

  Recommendations:
  [LOW]  Add .editorconfig for consistent formatting
  [MED]  Configure test coverage reporting
  [MED]  Add architecture decision records
```

---

## Why Agent Readiness Matters

AI coding agents like **Claude Code**, **Cursor**, **GitHub Copilot**, **OpenAI Codex**, and **Devin** are transforming how software gets built. But their effectiveness depends heavily on how your codebase is structured.

Repos with clear conventions, solid test suites, good documentation, and consistent CI/CD pipelines let AI agents work autonomously with fewer errors and hallucinations. Repos without these foundations force agents into guesswork.

**Agent readiness** is the measure of how well your codebase supports autonomous AI coding. [Factory.ai](https://factory.ai) popularized this concept, but their solution is proprietary and cloud-only. `@kodus/agent-readiness` brings the same evaluation to everyone -- open source, free, and running entirely on your machine.

---

## @kodus/agent-readiness vs Factory.ai

| Feature | @kodus/agent-readiness | Factory.ai |
|---|---|---|
| **Open Source** | MIT License | Proprietary |
| **Pricing** | Free forever | Token-based billing |
| **Vendor lock-in** | None -- agent-agnostic | Tied to Factory Droids |
| **Self-hosted** | Runs locally on your machine | Cloud only |
| **Data privacy** | Your code never leaves your machine | Sent to their servers |
| **Customizable** | Fully configurable via `.kodus-readiness.yml` | Limited |
| **CI/CD integration** | `--ci` + `--min-level` flags | API only |
| **Languages** | Node, Python, Go, Rust, Java, Kotlin | Limited |

---

## Features

- **39 automated checks** across **7 pillars** of codebase readiness
- **5 maturity levels** from Foundational to Autonomous
- **Interactive web dashboard** with radar charts and detailed breakdowns
- **AI-powered analysis** (optional) via `--ai` flag for deeper code evaluation
- **Multi-language support**: Node.js, Python, Go, Rust, Java, Kotlin
- **Monorepo detection**: npm/yarn/pnpm workspaces, Lerna, Nx, Turborepo
- **CI/CD gates** with `--ci` and `--min-level` for quality enforcement
- **Fully configurable** via `.kodus-readiness.yml`
- **JSON output** for programmatic integrations

---

## Quick Start

Run it instantly with no installation:

```bash
# Using bun
bunx @kodus/agent-readiness .

# Using npx
npx @kodus/agent-readiness .

# Evaluate a specific repository
bunx @kodus/agent-readiness /path/to/repo

# With AI-powered analysis
bunx @kodus/agent-readiness . --ai --api-key sk-your-key

# JSON output for integrations
bunx @kodus/agent-readiness . --format json

# CI mode with minimum level gate
bunx @kodus/agent-readiness . --ci --min-level 3
```

---

## The 7 Pillars

Agent readiness is evaluated across seven pillars, each covering a critical aspect of codebase health for AI agents:

| Pillar | Description | Checks |
|---|---|---|
| 🎨 **Style & Linting** | Consistent code style and static analysis enforcement | Linter, formatter, type checker, pre-commit hooks, editorconfig, naming conventions |
| 🧪 **Testing** | Presence, breadth, and automation of your test suite | Test framework, test files, test script, coverage config, E2E tests, test quality |
| 📚 **Documentation** | Quality and breadth of documentation for humans and AI | README, contributing guide, API docs, CODEOWNERS, AI context files, architecture docs, README quality, agent-friendliness |
| 🔧 **Dev Environment** | Reproducible, well-documented developer setup | Lock file, containerization, env documentation, setup scripts, version pinning |
| ⚙️ **CI/CD** | Continuous integration and delivery pipeline coverage | CI config, CI runs tests, CI runs linters, build automation, deploy pipeline, branch protection |
| 💚 **Code Health** | Dependency freshness, dead code, and bundle hygiene | Outdated deps detection, dead code detection, bundle analysis |
| 🔒 **Security** | Security posture including scanning and secret detection | License, security scanning, secrets detection, security policy, dependency update automation |

---

## Maturity Levels

Your codebase is assigned a maturity level based on which criteria pass at each tier. You must pass at least 80% of criteria at a level to advance to the next.

| Level | Name | Description |
|---|---|---|
| **1** | **Foundational** | Basic setup and essential files present (README, license, lock file, editorconfig) |
| **2** | **Guided** | Core tooling configured -- linters, formatters, test frameworks, CI basics |
| **3** | **Structured** | Good practices established -- type checking, pre-commit hooks, security policies, containerization |
| **4** | **Optimized** | Advanced practices -- coverage reporting, E2E tests, deploy pipelines, security scanning |
| **5** | **Autonomous** | Maximum AI agent readiness -- AI context files, architecture docs, naming conventions, bundle analysis |

---

## CLI Usage

```
Usage: agent-readiness [path] [options]

Arguments:
  path                   Path to the repository to evaluate (default: current directory)

Options:
  --ai                   Enable AI-powered criteria evaluation
  --api-key <key>        API key for AI evaluations (or set KODUS_API_KEY / OPENAI_API_KEY)
  --ci                   Run in CI mode (non-interactive, exit code reflects level)
  --format <format>      Output format: "text" or "json" (default: "text")
  --min-level <n>        Minimum maturity level required (1-5). Exits with code 1 if below threshold
  --no-color             Disable colored output
  --no-web               Disable the web dashboard
  --init                 Generate a .kodus-readiness.yml config file and exit
  -V, --version          Show version number
  -h, --help             Show help
```

### Environment Variables

| Variable | Description |
|---|---|
| `KODUS_API_KEY` | API key for AI-powered evaluations |
| `OPENAI_API_KEY` | Fallback API key for AI evaluations |
| `CI` | When set to `"true"`, automatically enables CI mode |

---

## Web Dashboard

After running an evaluation, an interactive web dashboard opens automatically in your browser. It provides:

- **Radar chart** visualizing scores across all 7 pillars
- **Detailed criterion breakdown** with pass/fail status and messages
- **Recommendations** prioritized by impact and effort
- **Project overview** including detected languages and monorepo structure

To disable the dashboard, use the `--no-web` flag:

```bash
bunx @kodus/agent-readiness . --no-web
```

---

## Configuration

Generate a default configuration file:

```bash
bunx @kodus/agent-readiness --init
```

This creates a `.kodus-readiness.yml` in your repository root:

```yaml
# Toggle entire pillars on or off
pillars:
  style-linting: true
  testing: true
  documentation: true
  dev-environment: true
  ci-cd: true
  code-health: true
  security: true

# Fine-grained toggles for individual criteria
criteria:
  # Style & Linting
  linter: true
  formatter: true
  type-checker: true
  pre-commit-hooks: true
  editorconfig: true
  naming-conventions: true

  # Testing
  test-framework: true
  test-files-exist: true
  test-script: true
  coverage-config: true
  e2e-tests: true
  test-quality: true

  # Documentation
  readme: true
  contributing: true
  api-docs: true
  codeowners: true
  ai-context: true
  architecture-docs: true
  readme-quality: true
  docs-agent-friendliness: true

  # Dev Environment
  lock-file: true
  containerization: true
  env-documentation: true
  setup-script: true
  version-pinned: true

  # CI/CD
  ci-config: true
  ci-runs-tests: true
  ci-runs-linters: true
  build-automated: true
  deploy-pipeline: true
  branch-protection: true

  # Code Health
  no-outdated-deps: true
  dead-code-detection: true
  bundle-analysis: true

  # Security
  license: true
  security-scanning: true
  secrets-detection: true
  security-policy: true
  dep-update-automation: true

# Thresholds
thresholds:
  # Minimum percentage of criteria that must pass to reach a level (default: 0.8)
  # level-pass: 0.8

# AI Settings
# aiEnabled: false
# apiKey: ""           # Or set KODUS_API_KEY env variable
# apiBaseUrl: ""       # Custom endpoint for the LLM API
```

CLI flags always override config file values.

---

## CI/CD Integration

Use `@kodus/agent-readiness` as a quality gate in your CI pipeline. The `--ci` flag enables non-interactive mode, and `--min-level` fails the build if your codebase doesn't meet the required maturity level.

### GitHub Actions

```yaml
name: Agent Readiness Check

on: [push, pull_request]

jobs:
  readiness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Check AI Agent Readiness
        run: bunx @kodus/agent-readiness . --ci --min-level 3
```

### With AI-Powered Analysis

```yaml
      - name: Check AI Agent Readiness (with AI)
        run: bunx @kodus/agent-readiness . --ci --min-level 3 --ai
        env:
          KODUS_API_KEY: ${{ secrets.KODUS_API_KEY }}
```

### Exit Codes

| Code | Meaning |
|---|---|
| `0` | Passed -- maturity level meets or exceeds `--min-level` |
| `1` | Failed -- maturity level is below `--min-level` |

---

## AI-Powered Analysis

Four criteria use AI for deeper evaluation that goes beyond file detection:

| Criterion | What It Evaluates |
|---|---|
| **naming-conventions** | File and function naming consistency (kebab-case, camelCase, PascalCase) |
| **test-quality** | Whether tests are meaningful, well-structured, and cover key functionality |
| **readme-quality** | README effectiveness -- project purpose, setup, usage, contributing instructions |
| **docs-agent-friendliness** | Whether documentation helps AI agents understand and navigate the codebase |

Enable AI analysis:

```bash
# Using --api-key flag
bunx @kodus/agent-readiness . --ai --api-key sk-your-key

# Using environment variable
export KODUS_API_KEY=sk-your-key
bunx @kodus/agent-readiness . --ai
```

Uses an OpenAI-compatible API. Configure a custom endpoint in `.kodus-readiness.yml`:

```yaml
aiEnabled: true
apiKey: "sk-your-key"
apiBaseUrl: "https://your-custom-endpoint.com/v1"
```

Without `--ai`, AI-powered criteria are **skipped** (not counted as failures).

---

## All Checks

<details>
<summary><strong>View all 39 criteria across 7 pillars</strong></summary>

### 🎨 Style & Linting

| Criterion | Level | AI | What It Detects |
|---|---|---|---|
| `editorconfig` | 1 | No | `.editorconfig` file |
| `linter` | 2 | No | ESLint, Biome, Ruff, golangci-lint, detekt, ktlint, Checkstyle, PMD, SpotBugs, clippy |
| `formatter` | 2 | No | Prettier, Biome, Black, Ruff, gofmt, ktlint, ktfmt, Spotless, google-java-format, rustfmt |
| `type-checker` | 3 | No | TypeScript strict, mypy, pyright, Kotlin/Go/Java/Rust (built-in static types) |
| `pre-commit-hooks` | 3 | No | Husky, Lefthook, pre-commit, lint-staged |
| `naming-conventions` | 5 | Yes | File/function naming patterns and consistency |

### 🧪 Testing

| Criterion | Level | AI | What It Detects |
|---|---|---|---|
| `test-framework` | 2 | No | Jest, Vitest, pytest, Go test, JUnit, TestNG, Kotest, Rust #[test] |
| `test-files-exist` | 2 | No | `*.test.*`, `*.spec.*`, `test_*.py`, `*_test.go`, `*Test.kt`, `*Test.java`, `tests/*.rs` |
| `test-script` | 2 | No | package.json, Makefile, Gradle, Maven, Cargo |
| `coverage-config` | 4 | No | nyc, Jest, Vitest, .coveragerc, JaCoCo, Kover, tarpaulin, cargo-llvm-cov |
| `e2e-tests` | 4 | No | Playwright, Cypress, E2E/integration directories |
| `test-quality` | 5 | Yes | Test meaningfulness and coverage of key functionality |

### 📚 Documentation

| Criterion | Level | AI | What It Detects |
|---|---|---|---|
| `readme` | 1 | No | README.md with substantive content (>500 chars) |
| `contributing` | 2 | No | CONTRIBUTING.md |
| `api-docs` | 3 | No | OpenAPI/Swagger specs, JSDoc/TypeDoc config |
| `codeowners` | 3 | No | CODEOWNERS file |
| `ai-context` | 3 | No | CLAUDE.md, .cursorrules, copilot-instructions.md |
| `architecture-docs` | 4 | No | Architecture docs, ADRs |
| `readme-quality` | 5 | Yes | README effectiveness and completeness |
| `docs-agent-friendliness` | 5 | Yes | Whether docs help AI agents understand the codebase |

### 🔧 Dev Environment

| Criterion | Level | AI | What It Detects |
|---|---|---|---|
| `lock-file` | 1 | No | package-lock.json, bun.lockb, yarn.lock, go.sum, Cargo.lock, gradle.lockfile, etc. |
| `env-documentation` | 2 | No | .env.example, .env.template |
| `setup-script` | 2 | No | Makefile targets, setup scripts, `dev` script, Gradle wrapper, Maven wrapper |
| `version-pinned` | 2 | No | .nvmrc, .python-version, .tool-versions, mise.toml, .sdkmanrc, .java-version, rust-toolchain.toml |
| `containerization` | 3 | No | Dockerfile, docker-compose, devcontainers |

### ⚙️ CI/CD

| Criterion | Level | AI | What It Detects |
|---|---|---|---|
| `ci-config` | 2 | No | GitHub Actions, GitLab CI, CircleCI, Jenkins, Travis |
| `ci-runs-tests` | 3 | No | Test commands in CI workflows (npm/yarn/pnpm/bun test, Jest, Vitest, pytest, go test, Gradle, Maven, cargo test) |
| `ci-runs-linters` | 3 | No | Lint commands in CI workflows (ESLint, Biome, Ruff, golangci-lint, ktlint, detekt, Spotless, Checkstyle, PMD, cargo clippy, cargo fmt) |
| `build-automated` | 3 | No | Build scripts and CI build steps (npm/yarn build, Gradle, Maven, go build, cargo build, docker build, poetry build) |
| `deploy-pipeline` | 4 | No | Deploy/release jobs, Vercel, Netlify, Fly.io, Terraform |
| `branch-protection` | 4 | No | Branch protection rules and settings |

### 💚 Code Health

| Criterion | Level | AI | What It Detects |
|---|---|---|---|
| `no-outdated-deps` | 3 | No | Lock file freshness across all languages (npm, yarn, pnpm, bun, Gradle, Poetry, Pipfile, go.sum, Cargo.lock) |
| `dead-code-detection` | 4 | No | Knip, unused-exports ESLint plugin, detekt, vulture (Python), cargo-udeps (Rust), SpotBugs/FindBugs (Java) |
| `bundle-analysis` | 5 | No | webpack-bundle-analyzer, @next/bundle-analyzer, size-limit |

### 🔒 Security

| Criterion | Level | AI | What It Detects |
|---|---|---|---|
| `license` | 1 | No | LICENSE file |
| `security-policy` | 3 | No | SECURITY.md |
| `dep-update-automation` | 3 | No | Dependabot, Renovate, Gradle versions plugin |
| `security-scanning` | 4 | No | CodeQL, Snyk, Trivy, Semgrep, SonarQube, OWASP dependency-check, cargo-audit |
| `secrets-detection` | 4 | No | gitleaks, detect-secrets in pre-commit or CI |

</details>

---

## Contributing

Contributions are welcome! Here's how to get started:

```bash
# Clone the repo
git clone https://github.com/kodus-ai/agent-readiness.git
cd agent-readiness

# Install dependencies
bun install

# Run in development mode
bun run dev

# Run the web dashboard in dev mode
bun run dev:web

# Type check
bun run typecheck

# Lint
bun run lint

# Build everything
bun run build:all
```

To add a new criterion, create a check function in the appropriate pillar file under `src/pillars/` and register it in the pillar's criteria array.

---

## License

MIT -- see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with care by <a href="https://kodus.io">Kodus</a>
</p>
