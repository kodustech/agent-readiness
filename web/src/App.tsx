import type { ReportData } from "./types";
import Dashboard from "./components/Dashboard";

const MOCK_DATA: ReportData = {
  repoName: "example-repo",
  repoPath: "/path/to/example-repo",
  projectInfo: { detectedTypes: ["node", "typescript"], isMonorepo: false, packages: [] },
  pillars: [
    {
      id: "style-linting",
      name: "Style & Linting",
      description: "Code style and linting configuration",
      icon: "\u{1F3A8}",
      criteria: [
        { id: "linter", name: "Linter configured", description: "Has ESLint or similar", pillarId: "style-linting", level: 2, requiresLLM: false },
        { id: "formatter", name: "Formatter configured", description: "Has Prettier or similar", pillarId: "style-linting", level: 2, requiresLLM: false },
      ],
    },
    {
      id: "testing",
      name: "Testing",
      description: "Testing framework and coverage",
      icon: "\u{1F9EA}",
      criteria: [
        { id: "test-framework", name: "Test framework", description: "Has Jest or similar", pillarId: "testing", level: 2, requiresLLM: false },
      ],
    },
  ],
  results: {
    "style-linting": [
      { criterionId: "linter", pass: true, message: "ESLint is configured" },
      { criterionId: "formatter", pass: false, message: "No formatter found" },
    ],
    testing: [
      { criterionId: "test-framework", pass: true, message: "Jest is configured" },
    ],
  },
  levelResult: {
    level: 2,
    nextLevelProgress: { current: 2, needed: 4, remaining: 2, nextLevel: 3 },
  },
  pillarScores: [
    { pillarId: "style-linting", passed: 1, total: 2, percentage: 50 },
    { pillarId: "testing", passed: 1, total: 1, percentage: 100 },
  ],
  recommendations: [
    {
      title: "Add a code formatter",
      description: "Configure Prettier or Biome to enforce consistent code formatting.",
      reason: "Consistent formatting helps AI agents produce code that matches your style.",
      effort: "low",
      impact: "high",
      pillarId: "style-linting",
      criterionId: "formatter",
    },
  ],
};

function App() {
  const data: ReportData | undefined = window.__KODUS_REPORT_DATA__ ?? MOCK_DATA;

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-lg">No report data found.</p>
      </div>
    );
  }

  return <Dashboard data={data} />;
}

export default App;
