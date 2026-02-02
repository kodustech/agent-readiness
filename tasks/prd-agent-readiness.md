# PRD: Kodus Agent Readiness

## Introduction

**Kodus Agent Readiness** is an open-source CLI tool that evaluates how prepared a codebase is for autonomous AI coding agents. It analyzes repositories across multiple dimensions — from linting and testing to documentation and security — and produces a beautiful, interactive terminal report with a maturity score and actionable recommendations.

The core insight: when AI agents fail, it's usually the environment's fault, not the agent's. Missing linters mean the agent can't auto-fix style. No tests mean the agent can't validate its changes. Poor docs mean the agent guesses and fails. This tool identifies exactly what's holding your repo back and tells you how to fix it.

Built with **Bun** and featuring a rich TUI (Terminal User Interface) with colors, progress bars, and visual hierarchy, the report should be something teams *want* to share — not just another wall of text.

## Goals

- Provide a single command (`npx kodus-agent-readiness`) that evaluates any repository's readiness for AI agents
- Deliver a visually stunning terminal report with clear scoring, visual indicators, and prioritized recommendations
- Combine fast static analysis (file checks, config parsing) with LLM-powered evaluation for subjective criteria (documentation quality, code organization)
- Offer an open-source, community-driven alternative to proprietary readiness tools
- Help teams systematically improve their repos for better AI agent performance
- Be framework/language-aware but useful for any codebase

## User Stories

### US-001: Run readiness analysis on a repository
**Description:** As a developer, I want to run a single command in my repo to get a full readiness assessment so I know how prepared my codebase is for AI agents.

**Acceptance Criteria:**
- [ ] Running `npx kodus-agent-readiness` in a repo root starts the analysis
- [ ] Running `npx kodus-agent-readiness ./path/to/repo` analyzes a specific path
- [ ] Shows animated progress indicator during analysis (spinner + current pillar being analyzed)
- [ ] Completes static analysis checks without requiring any API keys
- [ ] Exits with code 0 on success, non-zero on analysis failure
- [ ] Typecheck passes

### US-002: View beautiful terminal report with overall score
**Description:** As a developer, I want to see a visually rich terminal report with my repo's overall readiness level so I can quickly understand where I stand.

**Acceptance Criteria:**
- [ ] Report displays overall maturity level (1-5) with large, styled level indicator
- [ ] Shows overall percentage score with colored progress bar
- [ ] Displays a summary card per pillar with individual score and pass/fail icon
- [ ] Uses color coding: green (passing), yellow (partial), red (failing)
- [ ] Renders properly in standard terminal widths (80+ columns)
- [ ] Works in both light and dark terminal themes
- [ ] Typecheck passes

### US-003: View detailed per-pillar breakdown
**Description:** As a developer, I want to drill into each pillar's details so I understand exactly which criteria passed and failed.

**Acceptance Criteria:**
- [ ] Each pillar section shows its criteria with pass/fail status
- [ ] Failed criteria include a brief explanation of why it failed
- [ ] Criteria are grouped by pillar with clear visual separation
- [ ] Shows criteria count per pillar (e.g., "7/10 passing")
- [ ] Typecheck passes

### US-004: Get prioritized recommendations
**Description:** As a developer, I want actionable, prioritized recommendations so I know what to fix first for maximum impact.

**Acceptance Criteria:**
- [ ] Report ends with a "Top Recommendations" section
- [ ] Recommendations are sorted by impact (highest first)
- [ ] Each recommendation includes: what to do, why it matters, estimated effort (low/medium/high)
- [ ] Recommendations reference the specific pillar and criterion they address
- [ ] Maximum of 10 recommendations shown (most impactful)
- [ ] Typecheck passes

### US-005: LLM-enhanced evaluation for subjective criteria
**Description:** As a developer, I want the tool to use LLM analysis for criteria that can't be checked with simple file existence so I get a more accurate assessment.

**Acceptance Criteria:**
- [ ] When `--ai` flag is passed and API key is configured, LLM evaluates subjective criteria (doc quality, code organization, README completeness)
- [ ] API key can be set via `KODUS_API_KEY` or `OPENAI_API_KEY` env var, or `--api-key` flag
- [ ] LLM evaluation shows separate progress from static analysis
- [ ] If no API key is provided, skips LLM criteria gracefully and marks them as "skipped"
- [ ] Static analysis works fully without any API key (default mode)
- [ ] Report indicates which criteria were LLM-evaluated vs statically checked
- [ ] Typecheck passes

### US-006: Monorepo support
**Description:** As a developer working in a monorepo, I want the tool to detect and evaluate individual apps/packages so I get per-app scores.

**Acceptance Criteria:**
- [ ] Detects monorepo structures (workspaces in package.json, lerna.json, pnpm-workspace.yaml, nx.json)
- [ ] Shows per-app/package scores in addition to repo-wide score
- [ ] Repo-scoped criteria (CODEOWNERS, CI config) evaluated once
- [ ] App-scoped criteria (linters, tests, types) evaluated per package
- [ ] Summary shows "3/4 apps have linters" style aggregation
- [ ] Typecheck passes

### US-007: Configuration file support
**Description:** As a developer, I want to customize which pillars and criteria are evaluated so I can tailor the assessment to my project.

**Acceptance Criteria:**
- [ ] Supports `.agent-readiness.json` or `.agent-readiness.yaml` config file in repo root
- [ ] Config allows disabling specific pillars or criteria
- [ ] Config allows setting custom thresholds per pillar
- [ ] Running without config file uses sensible defaults
- [ ] `--init` flag generates a default config file
- [ ] Typecheck passes

### US-008: CI-friendly output mode
**Description:** As a developer, I want a non-interactive output mode so I can run readiness checks in CI pipelines.

**Acceptance Criteria:**
- [ ] `--ci` flag disables interactive TUI and animations
- [ ] CI mode outputs clean, parseable text
- [ ] `--format json` outputs structured JSON for programmatic consumption
- [ ] `--min-level N` flag exits with non-zero code if level < N (for CI gates)
- [ ] Respects `CI=true` and `NO_COLOR` environment variables automatically
- [ ] Typecheck passes

## Functional Requirements

### Analysis Engine

- FR-1: The CLI must scan the repository root and detect project type(s) (Node.js, Python, Go, Java, Rust, etc.)
- FR-2: Each criterion must be evaluated as binary: pass or fail
- FR-3: Static criteria must check for file existence, config parsing, or pattern matching — no network calls required
- FR-4: LLM criteria must send minimal context (file snippets, not full files) to reduce cost and latency
- FR-5: Analysis must complete static checks in under 10 seconds for average-sized repos
- FR-6: Each pillar must have a weighted score (0-100%) based on its criteria pass rate
- FR-7: Overall level is determined by the lowest pillar score meeting the 80% threshold per level

### Maturity Levels

- FR-8: **Level 1 — Foundational**: Basic project structure exists (package manager, entry point, some form of version control)
- FR-9: **Level 2 — Guided**: Documentation and basic tooling in place (README, contributing guide, linter configured)
- FR-10: **Level 3 — Structured**: Enforced standards and automation (CI pipeline, pre-commit hooks, test suite, type checking) — *this is the target level for production agent use*
- FR-11: **Level 4 — Optimized**: Comprehensive coverage (high test coverage, security scanning, observability, code review automation)
- FR-12: **Level 5 — Autonomous**: Full autonomous readiness (comprehensive CI/CD, automated dependency updates, feature flags, rollback capabilities)

### Scoring

- FR-13: Each level requires 80% of its criteria to pass before unlocking
- FR-14: Levels are sequential — cannot be Level 3 without passing Level 2
- FR-15: Report must show progress toward next level (e.g., "3 more criteria to reach Level 3")

### TUI / Report

- FR-16: Use a TUI library (e.g., `@clack/prompts`, `ink`, or `@terminali/core`) for rich terminal output
- FR-17: Report must include: header with repo name, overall level badge, pillar summary grid, detailed breakdown, recommendations
- FR-18: Colors must follow semantic meaning: green=pass, red=fail, yellow=partial/warning, blue=info
- FR-19: Support `--no-color` flag and `NO_COLOR` env var for accessibility
- FR-20: Report width must adapt to terminal width (min 80 columns)

## Pilares (Adapted from Factory.ai)

### 1. Style & Linting (Estilo e Validacao)
Checks for automated code style enforcement:
- Linter configured and has rules (ESLint, Biome, Ruff, golangci-lint, etc.)
- Formatter configured (Prettier, Black, gofmt, etc.)
- Type checker enabled (TypeScript strict, mypy, etc.)
- Pre-commit hooks for style enforcement (husky, lint-staged, lefthook)
- Editor config (.editorconfig) exists

### 2. Testing & Validation (Testes e Validacao)
Checks for automated testing capabilities:
- Test framework configured (Jest, Vitest, Pytest, Go test, etc.)
- Test files exist and follow naming conventions
- Test script defined in package.json / Makefile / etc.
- Coverage reporting configured
- E2E or integration test setup exists

### 3. Documentation & Context (Documentacao e Contexto)
Checks for documentation that helps agents understand the codebase:
- README.md exists and is substantive (not just project name)
- CONTRIBUTING.md or development guide exists
- API documentation exists (OpenAPI, JSDoc, etc.)
- Architecture decision records or design docs
- Inline documentation quality (LLM-evaluated)
- CODEOWNERS file exists
- `.cursor/rules`, `.github/copilot-instructions.md`, `CLAUDE.md`, or similar AI context files

### 4. Development Environment (Ambiente de Desenvolvimento)
Checks for reproducible development setup:
- Lock file exists (package-lock.json, bun.lockb, poetry.lock, go.sum)
- Docker / devcontainer configuration
- Environment variable documentation (.env.example)
- Setup script or documented setup steps
- Node/Python/Go version pinned (.nvmrc, .python-version, go.mod)

### 5. CI/CD & Automation (Integracao Continua)
Checks for automated pipelines:
- CI configuration exists (GitHub Actions, GitLab CI, etc.)
- CI runs tests on PRs
- CI runs linters on PRs
- Build step defined and automated
- Deploy pipeline configured
- Branch protection / merge requirements documented

### 6. Code Health (Saude do Codigo)
Checks for code quality signals:
- Dependency freshness (no critically outdated deps)
- No known security vulnerabilities in dependencies
- Reasonable file/function sizes (LLM-evaluated)
- Consistent project structure (LLM-evaluated)
- Dead code / unused exports detection configured

### 7. Security & Governance (Seguranca e Governanca)
Checks for security practices:
- Security scanning configured (Snyk, Dependabot, CodeQL, etc.)
- Secrets detection configured (git-secrets, gitleaks, etc.)
- License file exists
- Security policy (SECURITY.md) exists
- Dependency update automation (Dependabot, Renovate)

## Non-Goals

- **Not a code quality score**: This is specifically about AI agent readiness, not general code quality
- **No auto-remediation in v1**: The tool reports and recommends; it does not create PRs or modify files
- **No dashboard or web UI**: v1 is CLI-only with terminal output
- **No historical tracking**: v1 does not store or compare past results
- **No GitHub/GitLab integration**: v1 does not post comments on PRs or integrate with VCS platforms
- **No paid tier or proprietary features**: Fully open source, all features available to everyone

## Technical Considerations

### Runtime & Build
- **Runtime**: Bun (primary), with Node.js compatibility
- **Language**: TypeScript (strict mode)
- **Distribution**: Published to npm, runnable via `npx kodus-agent-readiness` or `bunx kodus-agent-readiness`
- **Binary**: Consider `bun build --compile` for standalone binary distribution

### TUI Library
- Evaluate: `@clack/prompts`, `ink` (React for CLI), `terminal-kit`, `chalk` + `boxen` + `cli-table3`, or `@terminali/core`
- Priority: visual quality > bundle size > API simplicity
- Must support: colors, boxes, tables, progress bars, spinners, Unicode symbols

### LLM Integration
- Support OpenAI-compatible API (works with OpenAI, Anthropic via proxy, local models via Ollama)
- Use structured output (JSON mode) for consistent scoring
- Cache LLM results per file hash to avoid redundant calls
- Total LLM cost per analysis should be < $0.05 for average repo

### Architecture
- Plugin-based pillar system: each pillar is a module that exports its criteria checkers
- Criteria checkers are async functions returning `{ pass: boolean, message: string, details?: string }`
- Separation between analysis engine, scoring engine, and presentation layer
- Easy to add new criteria or pillars without modifying core logic

### Dependencies (Minimal)
- `chalk` or `picocolors` — terminal colors
- `boxen` — boxes in terminal
- `cli-table3` or `tty-table` — formatted tables
- `ora` or `nanospinner` — spinners
- `commander` or `citty` — CLI argument parsing
- `yaml` — YAML config parsing
- `glob` / `fast-glob` — file pattern matching
- `semver` — version comparison

## Success Metrics

- Developers can assess any repo's agent readiness in under 30 seconds (static only)
- Report is visually clear enough that a developer understands their level and next steps within 10 seconds of reading
- Open source community adopts the tool: 500+ GitHub stars in first 3 months
- At least 3 community-contributed pillar plugins within 6 months
- Teams report measurable improvement in AI agent success rate after following recommendations

## Open Questions

1. Should we support a `--watch` mode that re-evaluates on file changes during development?
2. Should criteria weights be configurable, or fixed per level?
3. Should the LLM provider be pluggable (OpenAI, Anthropic, Ollama) or start with one?
4. Do we want a `--compare` flag that shows diff between two runs (requires storing results)?
5. Should we integrate with the existing Kodus CLI (`kodus readiness`) or keep it as a separate standalone package?
6. What license? MIT or Apache 2.0?
7. Should we have a `--fix` mode in v1 that at least suggests copy-pasteable commands (e.g., `bun add -D eslint`)?
