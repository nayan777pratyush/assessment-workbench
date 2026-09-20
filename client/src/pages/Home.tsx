import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bug,
  BriefcaseBusiness,
  Camera,
  CalendarDays,
  Bell,
  BookOpen,
  Bot,
  Box,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  ClipboardList,
  Code2,
  Command,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileJson,
  FileText,
  Files,
  Flag,
  Folder,
  FolderOpen,
  GitBranch,
  GitCommitHorizontal,
  GitCompare,
  Github,
  Globe2,
  Gauge,
  History,
  Info,
  Keyboard,
  LayoutDashboard,
  Loader2,
  ListChecks,
  LockKeyhole,
  LogIn,
  Mail,
  Mic,
  MonitorUp,
  Maximize2,
  MessageSquareText,
  Minimize2,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  Sun,
  Terminal,
  Timer,
  Trash2,
  UserRound,
  UserCheck,
  Volume2,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { startProviderLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import CandidatePortal from "./CandidatePortal";
import AdminPortal from "./AdminPortal";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Screen = "workspace" | "dashboard" | "detail";
type ActivityTab = "files" | "problems" | "git" | "events";

type ChatMessage = { role: "ai" | "user"; text: string };

type Commit = {
  id: string;
  time: string;
  message: string;
  problem: string;
  additions: number;
  deletions: number;
  state: "checkpoint" | "test" | "submit";
};

const starterCode = `function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    seen.set(nums[i], i);
  }

  return [];
}

module.exports = twoSum;`;

const supportedLanguages = [
  "C",
  "C++",
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "Ruby",
  "R",
  "Go",
];
const problemNames: Record<number, string> = {
  1: "Two Sum",
  2: "Valid Parentheses",
  3: "Merge Intervals",
};
const problemDescriptions: Record<number, string> = {
  1: "Return the indices of two numbers that add up to target. Each input has exactly one solution.",
  2: "Given a string containing brackets, determine whether the input sequence is valid and properly nested.",
  3: "Given an array of intervals, merge all overlapping intervals and return the non-overlapping result.",
};
const problemTemplates: Record<number, string> = {
  1: starterCode,
  2: "",
  3: "",
};

const initialCommits: Commit[] = [
  {
    id: "8a1f0c2",
    time: "14:31:02",
    message: "final: handle duplicate values",
    problem: "Two Sum",
    additions: 12,
    deletions: 4,
    state: "submit",
  },
  {
    id: "76bd4a1",
    time: "14:27:45",
    message: "optimize lookup with a hash map",
    problem: "Two Sum",
    additions: 18,
    deletions: 7,
    state: "checkpoint",
  },
  {
    id: "4e82b11",
    time: "14:16:02",
    message: "fix index ordering on match",
    problem: "Two Sum",
    additions: 6,
    deletions: 3,
    state: "test",
  },
  {
    id: "b901c33",
    time: "14:08:42",
    message: "add first implementation",
    problem: "Two Sum",
    additions: 31,
    deletions: 0,
    state: "checkpoint",
  },
];

const activityItems: { id: ActivityTab; label: string; icon: typeof Files }[] =
  [
    { id: "files", label: "Files", icon: Files },
    { id: "problems", label: "Problems", icon: ClipboardList },
    { id: "git", label: "Git", icon: GitBranch },
    { id: "events", label: "Events", icon: Activity },
  ];

const commitsChart = [
  { time: "14:00", commits: 0, churn: 0 },
  { time: "14:08", commits: 1, churn: 31 },
  { time: "14:16", commits: 2, churn: 40 },
  { time: "14:21", commits: 2, churn: 40 },
  { time: "14:27", commits: 3, churn: 65 },
  { time: "14:31", commits: 4, churn: 73 },
];

const activityChart = [
  { name: "Mon", sessions: 12, review: 2 },
  { name: "Tue", sessions: 18, review: 3 },
  { name: "Wed", sessions: 14, review: 1 },
  { name: "Thu", sessions: 23, review: 5 },
  { name: "Fri", sessions: 19, review: 3 },
  { name: "Sat", sessions: 8, review: 1 },
  { name: "Sun", sessions: 5, review: 0 },
];

function IconLabel({
  icon: Icon,
  children,
}: {
  icon: typeof Files;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon size={13} />
      {children}
    </span>
  );
}

function Topbar({
  screen,
  setScreen,
  terminalOpen,
  setTerminalOpen,
  leftOpen,
  setLeftOpen,
  rightOpen,
  setRightOpen,
  theme,
  toggleTheme,
  remainingSeconds,
  language,
  selectedProblem,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  terminalOpen: boolean;
  setTerminalOpen: (v: boolean) => void;
  leftOpen: boolean;
  setLeftOpen: (v: boolean) => void;
  rightOpen: boolean;
  setRightOpen: (v: boolean) => void;
  theme: string;
  toggleTheme?: () => void;
  remainingSeconds: number;
  language: string;
  selectedProblem: number;
}) {
  const hours = Math.floor(remainingSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
  return (
    <header className="topbar">
      <div className="brand" aria-label="Assessment Workbench home">
        <div className="brand-mark">A</div>
        <div>
          <div className="brand-name">ASSESSMENT WORKBENCH</div>
          <div className="brand-sub">controlled coding environment</div>
        </div>
      </div>
      <div className="assessment-crumb">
        <span className="status-chip live">
          <span className="dot" />
          LIVE SESSION
        </span>
        <div>
          <div className="crumb-label">Assessment</div>
          <div className="crumb-title">Algorithms · Spring cohort</div>
        </div>
      </div>
      <div className="topbar-center">
        {screen === "workspace" ? (
          <>
            <div className="problem-select">
              <BookOpen size={14} color="#7f9bbb" />
              <span>
                Problem 0{selectedProblem} / 04 ·{" "}
                {problemNames[selectedProblem]}
              </span>
              <ChevronDown size={12} />
            </div>
            <div className="problem-select">
              <Code2 size={13} color="#7f9bbb" />
              <span>{language}</span>
            </div>
            <div className="top-timer">
              <span className="timer-dot" />
              {hours}:{minutes}:{seconds}
            </div>
          </>
        ) : (
          <>
            <div className="problem-select">
              <LayoutDashboard size={14} color="#7f9bbb" />
              <strong>
                {screen === "detail"
                  ? "Session review · Priya Nair"
                  : "Evaluator console"}
              </strong>
            </div>
            <span className="status-chip demo">
              <span className="dot" />
              DEMO DATA
            </span>
          </>
        )}
      </div>
      <div className="top-actions">
        {screen === "workspace" ? (
          <button
            className="icon-btn"
            title="Open evaluator console"
            onClick={() => setScreen("dashboard")}
          >
            <BarChart3 size={16} />
          </button>
        ) : (
          <button
            className="icon-btn"
            title="Return to coding workspace"
            onClick={() => setScreen("workspace")}
          >
            <Code2 size={16} />
          </button>
        )}
        <button
          className="icon-btn"
          title="Toggle theme"
          onClick={() => toggleTheme?.()}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="icon-btn" title="Notifications">
          <Bell size={16} />
        </button>
        {screen === "workspace" && (
          <>
            <button
              className="icon-btn"
              title="Toggle activity sidebar"
              onClick={() => setLeftOpen(!leftOpen)}
            >
              {leftOpen ? (
                <PanelLeftClose size={16} />
              ) : (
                <PanelLeftOpen size={16} />
              )}
            </button>
            <button
              className="icon-btn"
              title="Toggle assistant panel"
              onClick={() => setRightOpen(!rightOpen)}
            >
              {rightOpen ? (
                <PanelRightClose size={16} />
              ) : (
                <PanelRightOpen size={16} />
              )}
            </button>
            <button
              className="icon-btn"
              title="Toggle terminal"
              onClick={() => setTerminalOpen(!terminalOpen)}
            >
              <SquareTerminal size={16} />
            </button>
          </>
        )}
        <div className="avatar" title="Student profile">
          PN
        </div>
      </div>
    </header>
  );
}

function ActivityRail({
  active,
  setActive,
  screen,
  setScreen,
}: {
  active: ActivityTab;
  setActive: (a: ActivityTab) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
}) {
  return (
    <aside className="activity-rail" aria-label="Activity navigation">
      {activityItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`rail-btn ${screen === "workspace" && active === id ? "active" : ""}`}
          aria-label={label}
          title={label}
          onClick={() => {
            setScreen("workspace");
            setActive(id);
          }}
        >
          <Icon size={18} />
          <span className="rail-label">{label}</span>
        </button>
      ))}
      <div className="rail-spacer" />
      <button
        className={`rail-btn ${screen === "dashboard" || screen === "detail" ? "active" : ""}`}
        aria-label="Evaluator"
        title="Evaluator console"
        onClick={() => setScreen("dashboard")}
      >
        <LayoutDashboard size={18} />
        <span className="rail-label">Review</span>
      </button>
      <button className="rail-btn" aria-label="Settings" title="Settings">
        <Settings2 size={18} />
        <span className="rail-label">Config</span>
      </button>
    </aside>
  );
}

function FilesPanel({
  activeFile,
  setActiveFile,
  collapsed,
  setCollapsed,
}: {
  activeFile: string;
  setActiveFile: (f: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [srcOpen, setSrcOpen] = useState(true);
  const [testsOpen, setTestsOpen] = useState(true);
  const matches = (name: string) =>
    name.toLowerCase().includes(query.toLowerCase());
  return (
    <section className="left-panel">
      <div className="panel-head">
        <span className="panel-kicker">Explorer</span>
        <div className="panel-actions">
          <button className="panel-action" title="New file">
            <Plus size={14} />
          </button>
          <button
            className="panel-action"
            title="Collapse sidebar"
            onClick={() => setCollapsed(true)}
          >
            <PanelLeftClose size={14} />
          </button>
          <button className="panel-action" title="More">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      <div className="panel-content">
        <div className="search-row">
          <Search size={13} />
          <input
            aria-label="Filter files"
            placeholder="Filter files"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="tree-section">
          <div className="tree-title">assessment-01</div>
          <button className="tree-row" onClick={() => setSrcOpen(!srcOpen)}>
            <ChevronRight
              className={`folder-chevron ${srcOpen ? "open" : ""}`}
              size={13}
            />
            <FolderOpen className="file-icon" size={14} />
            <span>src</span>
          </button>
          {srcOpen && (
            <>
              {matches("solution.js") && (
                <button
                  className={`tree-row indent-1 ${activeFile === "solution.js" ? "active" : ""}`}
                  onClick={() => setActiveFile("solution.js")}
                >
                  <FileCode2 className="file-icon ts" size={14} />
                  <span>solution.js</span>
                  <span className="dirty" />
                </button>
              )}
              {matches("helpers.js") && (
                <button
                  className={`tree-row indent-1 ${activeFile === "helpers.js" ? "active" : ""}`}
                  onClick={() => setActiveFile("helpers.js")}
                >
                  <FileCode2 className="file-icon ts" size={14} />
                  <span>helpers.js</span>
                </button>
              )}
              {matches("README.md") && (
                <button
                  className={`tree-row indent-1 ${activeFile === "README.md" ? "active" : ""}`}
                  onClick={() => setActiveFile("README.md")}
                >
                  <FileText className="file-icon" size={14} />
                  <span>README.md</span>
                </button>
              )}
            </>
          )}
          <button className="tree-row" onClick={() => setTestsOpen(!testsOpen)}>
            <ChevronRight
              className={`folder-chevron ${testsOpen ? "open" : ""}`}
              size={13}
            />
            <Folder className="file-icon" size={14} />
            <span>tests</span>
          </button>
          {testsOpen && matches("solution.test.js") && (
            <button
              className={`tree-row indent-1 ${activeFile === "solution.test.js" ? "active" : ""}`}
              onClick={() => setActiveFile("solution.test.js")}
            >
              <FileCode2 className="file-icon test" size={14} />
              <span>solution.test.js</span>
            </button>
          )}
          {matches("package.json") && (
            <button
              className={`tree-row ${activeFile === "package.json" ? "active" : ""}`}
              onClick={() => setActiveFile("package.json")}
            >
              <FileJson className="file-icon" size={14} />
              <span>package.json</span>
            </button>
          )}
          {matches("assessment.config.json") && (
            <button className="tree-row">
              <FileJson className="file-icon" size={14} />
              <span>assessment.config.json</span>
            </button>
          )}
        </div>
        <div
          className="tree-section"
          style={{ borderTop: "1px solid var(--line-soft)" }}
        >
          <div className="tree-title">Session controls</div>
          <div className="tree-row">
            <ShieldCheck className="file-icon" size={14} />
            <span>Controlled mode</span>
            <CheckCircle2
              size={13}
              color="#55d6b0"
              style={{ marginLeft: "auto" }}
            />
          </div>
          <div className="tree-row">
            <GitCommitHorizontal className="file-icon" size={14} />
            <span>Auto-checkpoints</span>
            <span style={{ marginLeft: "auto", color: "#e9b96d", fontSize: 9 }}>
              ON
            </span>
          </div>
          <div className="tree-row">
            <Wifi className="file-icon" size={14} />
            <span>Connection</span>
            <span style={{ marginLeft: "auto", color: "#55d6b0", fontSize: 9 }}>
              STABLE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemsPanel({
  selected,
  setSelected,
  setActiveFile,
}: {
  selected: number;
  setSelected: (n: number) => void;
  setActiveFile: (f: string) => void;
}) {
  const problems = [
    { n: 1, name: "Two Sum", difficulty: "Easy", done: true, tests: "8 / 8" },
    {
      n: 2,
      name: "Valid Parentheses",
      difficulty: "Easy",
      done: false,
      tests: "—",
    },
    {
      n: 3,
      name: "Merge Intervals",
      difficulty: "Medium",
      done: false,
      tests: "—",
    },
    { n: 4, name: "LRU Cache", difficulty: "Medium", done: false, tests: "—" },
  ];
  return (
    <section className="left-panel">
      <div className="panel-head">
        <span className="panel-kicker">
          Problems{" "}
          <span style={{ color: "#637487", fontWeight: 400 }}>
            · {selected} / 4
          </span>
        </span>
        <div className="panel-actions">
          <button className="panel-action" title="Problem list">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      <div className="panel-content">
        <div className="problem-list">
          {problems.map(p => (
            <button
              className={`problem-item ${selected === p.n ? "selected" : ""}`}
              key={p.n}
              onClick={() => {
                setSelected(p.n);
                setActiveFile("solution.js");
              }}
            >
              <span className="problem-num">0{p.n}</span>
              <span>
                <span className="problem-name">{p.name}</span>
                <span className="problem-meta">
                  <span
                    className={
                      p.difficulty === "Easy" ? "diff-easy" : "diff-medium"
                    }
                  >
                    {p.difficulty}
                  </span>
                  <span>·</span>
                  <span>{p.tests}</span>
                  {p.done && <Check className="check" size={12} />}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div
          className="tree-section"
          style={{ borderTop: "1px solid var(--line-soft)" }}
        >
          <div className="tree-title">
            Current problem · {problemNames[selected]}
          </div>
          <div
            style={{
              padding: "3px 7px 12px",
              color: "#98a8b8",
              fontSize: 10,
              lineHeight: 1.6,
            }}
          >
            {problemDescriptions[selected]}
          </div>
          <div className="tree-row">
            <Timer size={14} className="file-icon" />
            <span>Time limit</span>
            <span
              style={{ marginLeft: "auto", color: "#c4d1dc", fontSize: 10 }}
            >
              1 sec
            </span>
          </div>
          <div className="tree-row">
            <Box size={14} className="file-icon" />
            <span>Memory</span>
            <span
              style={{ marginLeft: "auto", color: "#c4d1dc", fontSize: 10 }}
            >
              64 MB
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function GitPanel({
  commits,
  selectedCommit,
  setSelectedCommit,
}: {
  commits: Commit[];
  selectedCommit: string;
  setSelectedCommit: (id: string) => void;
}) {
  return (
    <section className="left-panel">
      <div className="panel-head">
        <span className="panel-kicker">Git history</span>
        <div className="panel-actions">
          <button className="panel-action" title="Compare">
            <GitCompare size={14} />
          </button>
          <button className="panel-action" title="More">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      <div className="panel-content">
        <div className="tree-section">
          <div className="tree-row" style={{ paddingLeft: 6 }}>
            <GitBranch className="file-icon" size={14} />
            <span style={{ color: "#d4e0ea" }}>assessment/session-204</span>
          </div>
        </div>
        <div className="commit-list">
          {commits.map(commit => (
            <button
              key={commit.id}
              className={`problem-item ${selectedCommit === commit.id ? "selected" : ""}`}
              onClick={() => setSelectedCommit(commit.id)}
            >
              <span
                className="problem-num"
                style={{
                  color: commit.state === "submit" ? "#55d6b0" : "#71859a",
                }}
              >
                <GitCommitHorizontal size={14} />
              </span>
              <span>
                <span className="problem-name" style={{ fontWeight: 500 }}>
                  {commit.message}
                </span>
                <span className="problem-meta">
                  <span>{commit.time}</span>
                  <span>·</span>
                  <span style={{ color: "#55d6b0" }}>+{commit.additions}</span>
                  <span style={{ color: "#f07979" }}>-{commit.deletions}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventsPanel({ eventCount }: { eventCount: number }) {
  const events = [
    {
      time: "14:31:02",
      label: "Final submission",
      detail: "solution.js · 12 additions",
      color: "#55d6b0",
      icon: CheckCircle2,
    },
    {
      time: "14:27:45",
      label: "Code checkpoint",
      detail: "18 lines changed",
      color: "#62a9ff",
      icon: GitCommitHorizontal,
    },
    {
      time: "14:21:17",
      label: "Focus restored",
      detail: "window focus returned",
      color: "#8fa7be",
      icon: Circle,
    },
    {
      time: "14:21:09",
      label: "Focus lost",
      detail: "browser visibility change",
      color: "#e9b96d",
      icon: AlertTriangle,
    },
    {
      time: "14:12:39",
      label: "Test failed",
      detail: "2 cases · index ordering",
      color: "#f07979",
      icon: X,
    },
    {
      time: "14:02:10",
      label: "Assessment started",
      detail: "controlled mode entered",
      color: "#62a9ff",
      icon: Zap,
    },
  ];
  return (
    <section className="left-panel">
      <div className="panel-head">
        <span className="panel-kicker">
          Session events{" "}
          <span style={{ color: "#637487", fontWeight: 400 }}>
            · {eventCount} captured
          </span>
        </span>
        <div className="panel-actions">
          <button className="panel-action" title="Event filters">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      <div className="panel-content">
        <div className="timeline" style={{ padding: "16px 12px" }}>
          {events.map((e, i) => {
            const I = e.icon;
            return (
              <div className="timeline-item" key={i}>
                <div className="timeline-time">{e.time}</div>
                <div className="timeline-line">
                  <span
                    className="timeline-dot"
                    style={{
                      background: e.color,
                      boxShadow: `0 0 0 1px ${e.color}`,
                    }}
                  />
                </div>
                <div>
                  <div className="timeline-label">
                    <I
                      size={11}
                      style={{
                        color: e.color,
                        verticalAlign: "-2px",
                        marginRight: 4,
                      }}
                    />
                    {e.label}
                  </div>
                  <div className="timeline-desc">{e.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Workspace({
  activeTab,
  setActiveTab,
  activeFile,
  setActiveFile,
  leftOpen,
  setLeftOpen,
  rightOpen,
  setRightOpen,
  terminalOpen,
  setTerminalOpen,
  code,
  setCode,
  commits,
  selectedCommit,
  setSelectedCommit,
  selectedProblem,
  setSelectedProblem,
  eventCount,
  setEventCount,
  onToast,
  language,
  setLanguage,
  streams,
  onComplete,
}: {
  activeTab: ActivityTab;
  setActiveTab: (a: ActivityTab) => void;
  activeFile: string;
  setActiveFile: (f: string) => void;
  leftOpen: boolean;
  setLeftOpen: (v: boolean) => void;
  rightOpen: boolean;
  setRightOpen: (v: boolean) => void;
  terminalOpen: boolean;
  setTerminalOpen: (v: boolean) => void;
  code: string;
  setCode: (v: string) => void;
  commits: Commit[];
  selectedCommit: string;
  setSelectedCommit: (id: string) => void;
  selectedProblem: number;
  setSelectedProblem: (n: number) => void;
  eventCount: number;
  setEventCount: (n: number) => void;
  onToast: (text: string, tone?: "good" | "warn") => void;
  language: string;
  setLanguage: (language: string) => void;
  streams: React.MutableRefObject<Partial<Record<CheckId, MediaStream>>>;
  onComplete: () => void;
}) {
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "Assessment runtime · Node 20 · network disabled",
    "Ready for execution. Run tests to capture a result.",
  ]);
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "I can explain the problem constraints and help you reason about edge cases. I won't generate or insert a solution while this assessment is active.",
    },
    { role: "user", text: "What should I consider for duplicate values?" },
    {
      role: "ai",
      text: "Track the index of each value as you scan. If a complement is already present, return the earlier index and the current index. The first occurrence matters for deterministic output.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [running, setRunning] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [maxTerminal, setMaxTerminal] = useState(false);
  const [activeFileContent, setActiveFileContent] = useState<
    Record<string, string>
  >({
    "solution.js": code,
    "helpers.js": "export const pair = (a, b) => [a, b];",
    "README.md": "# Two Sum\n\nImplement the function in solution.js.",
    "solution.test.js":
      "test('returns matching indices', () => {\n  expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);\n});",
    "package.json":
      '{\n  "scripts": { "test": "node tests/solution.test.js" }\n}',
  });
  const currentContent =
    activeFile === "solution.js" ? code : activeFileContent[activeFile] || "";
  const lines = currentContent.split("\n");
  const [selectedLine, setSelectedLine] = useState(8);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setActiveFileContent(prev => ({
      ...prev,
      [activeFile]: activeFile === "solution.js" ? code : prev[activeFile],
    }));
  }, [code, activeFile]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChatInput("");
        return;
      }
      if (event.ctrlKey && event.key === "`") {
        event.preventDefault();
        setTerminalOpen(!terminalOpen);
      }
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setRightOpen(!rightOpen);
      }
      if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setLeftOpen(!leftOpen);
      }
      if (event.ctrlKey && event.key === "Tab") {
        event.preventDefault();
        setActiveFile(
          activeFile === "solution.js" ? "helpers.js" : "solution.js"
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    activeFile,
    leftOpen,
    rightOpen,
    terminalOpen,
    setActiveFile,
    setLeftOpen,
    setRightOpen,
    setTerminalOpen,
  ]);

  const runCode = () => {
    setRunning(true);
    setTerminalOpen(true);
    setEventCount(eventCount + 1);
    setTerminalLines([
      `$ run ${language.toLowerCase().replace("#", "sharp")}`,
      "",
      "Judge · hidden tests protected · 1.0s time limit",
      "",
      "Testcase 1  ✓ Passed",
      "  Input: nums = [2,7,11,15], target = 9",
      "  Output: [0,1]    Expected: [0,1]",
      "",
      "Testcase 2  ✓ Passed",
      "  Input: nums = [3,2,4], target = 6",
      "  Output: [1,2]    Expected: [1,2]",
      "",
      "Testcase 3  ✓ Passed",
      "  Input: nums = [3,3], target = 6",
      "  Output: [0,1]    Expected: [0,1]",
      "",
      "Accepted · 8 / 8 test cases passed · Runtime 72 ms · Memory 42.1 MB",
    ]);
    onToast("Accepted · 8 / 8 test cases passed", "good");
    window.setTimeout(() => setRunning(false), 900);
  };
  const saveCheckpoint = () => {
    setEventCount(eventCount + 1);
    onToast("Git checkpoint created · 8a1f0c2", "good");
  };
  const submit = () => {
    setEventCount(eventCount + 1);
    setTerminalOpen(true);
    setTerminalLines([
      "$ assessment submit --problem 01",
      "",
      "Validating final submission…",
      "✓ 8 test cases passed",
      "✓ Checkpoint captured",
      "",
      "Submission recorded. Problem 01 marked complete.",
    ]);
    onToast(
      "Assessment submitted · this one-time attempt is now closed",
      "good"
    );
    window.setTimeout(onComplete, 900);
  };
  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChat(prev => [
      ...prev,
      { role: "user", text: chatInput.trim() },
      {
        role: "ai",
        text: "That interaction is logged as assessment guidance. I can help you reason about constraints and test behavior, but I cannot write solution code during a live assessment.",
      },
    ]);
    setChatInput("");
    setEventCount(eventCount + 1);
  };
  const updateFile = (value: string) => {
    if (activeFile === "solution.js") setCode(value);
    else setActiveFileContent(prev => ({ ...prev, [activeFile]: value }));
  };
  const toggleTerminalMax = () => setMaxTerminal(!maxTerminal);

  return (
    <div className="workbench">
      <ActivityRail
        active={activeTab}
        setActive={setActiveTab}
        screen="workspace"
        setScreen={() => undefined}
      />
      {leftOpen &&
        (activeTab === "files" ? (
          <FilesPanel
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        ) : activeTab === "problems" ? (
          <ProblemsPanel
            selected={selectedProblem}
            setSelected={setSelectedProblem}
            setActiveFile={setActiveFile}
          />
        ) : activeTab === "git" ? (
          <GitPanel
            commits={commits}
            selectedCommit={selectedCommit}
            setSelectedCommit={setSelectedCommit}
          />
        ) : (
          <EventsPanel eventCount={eventCount} />
        ))}
      {!leftOpen && (
        <button
          className="icon-btn"
          style={{
            alignSelf: "stretch",
            borderRight: "1px solid var(--line)",
            borderRadius: 0,
            width: 28,
          }}
          aria-label="Open sidebar"
          title="Open sidebar"
          onClick={() => setLeftOpen(true)}
        >
          <PanelLeftOpen size={15} />
        </button>
      )}
      <main
        className="main-stage"
        style={maxTerminal ? { display: "flex" } : undefined}
      >
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button className="toolbar-btn" title="Command palette">
              <Command size={13} />
              Command
            </button>
            <button className="toolbar-btn" title="Search files">
              <Search size={13} />
              Search
            </button>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <select
              className="select-control"
              aria-label="Select programming language"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              {supportedLanguages.map(option => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <button
              className="toolbar-btn"
              onClick={() => setShowMinimap(!showMinimap)}
            >
              <Box size={13} />
              {showMinimap ? "Minimap" : "Focus"}
            </button>
            <button className="toolbar-btn">
              <Keyboard size={13} />
              Shortcuts
            </button>
          </div>
          <div className="toolbar-spacer" />
          <div className="toolbar-group">
            <button className="toolbar-btn" onClick={saveCheckpoint}>
              <GitCommitHorizontal size={13} />
              Checkpoint
            </button>
            <button
              className="toolbar-btn primary"
              onClick={runCode}
              disabled={running}
            >
              <Play size={13} fill="currentColor" />
              {running ? "Running…" : "Run tests"}
            </button>
            <button className="toolbar-btn primary" onClick={submit}>
              <Flag size={13} />
              Submit
            </button>
          </div>
        </div>
        {!maxTerminal && (
          <>
            <div className="tabbar">
              <button
                className={`editor-tab ${activeFile === "solution.js" ? "active" : ""}`}
                onClick={() => setActiveFile("solution.js")}
              >
                <FileCode2 size={13} color="#62a9ff" />
                solution.js
                <span className="tab-dirty" />
                <X className="tab-close" size={12} />
              </button>
              <button
                className={`editor-tab ${activeFile === "helpers.js" ? "active" : ""}`}
                onClick={() => setActiveFile("helpers.js")}
              >
                <FileCode2 size={13} color="#62a9ff" />
                helpers.js
                <X className="tab-close" size={12} />
              </button>
            </div>
            <div className="breadcrumbs">
              <span>src</span>
              <ChevronRight size={11} />
              <strong>{activeFile}</strong>
              <span style={{ marginLeft: "auto" }}>JavaScript</span>
            </div>
            <div className="editor-zone">
              <div className="code-scroll">
                <div className="gutter">
                  {lines.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedLine(i + 1)}
                      style={{
                        color: selectedLine === i + 1 ? "#b3c8db" : undefined,
                        cursor: "pointer",
                      }}
                    >
                      {String(i + 1).padStart(2, " ")}
                    </div>
                  ))}
                </div>
                <textarea
                  aria-label="Code editor"
                  className="code-editor"
                  value={currentContent}
                  onChange={e => updateFile(e.target.value)}
                  spellCheck={false}
                  onClick={e => {
                    const target = e.target as HTMLTextAreaElement;
                    const before = target.value.slice(0, target.selectionStart);
                    setSelectedLine(before.split("\n").length);
                  }}
                />
                {showMinimap && (
                  <div className="minimap">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`mini-line ${i % 5 === 1 ? "blue" : i % 6 === 3 ? "green" : ""} ${i % 4 === 0 ? "short" : i % 3 === 0 ? "mid" : ""}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="editor-status">
              <span>
                <Circle size={8} fill="#55d6b0" color="#55d6b0" />
                No errors
              </span>
              <span>Ln {selectedLine}, Col 1</span>
              <span>Spaces: 2</span>
              <span>UTF-8</span>
              <span className="status-right">
                <ShieldCheck size={11} color="#55d6b0" />
                Protected session
              </span>
            </div>
          </>
        )}
        {maxTerminal && (
          <div style={{ flex: 1, padding: 20 }}>
            <div className="detail-title" style={{ fontSize: 17 }}>
              Execution output
            </div>
            <TerminalOutput lines={terminalLines} />
          </div>
        )}
        {terminalOpen && !maxTerminal && (
          <div className="bottom-terminal">
            <div className="terminal-head">
              <span className="terminal-tab">
                <Terminal size={13} />
                Terminal
              </span>
              <span className="terminal-muted">Problems</span>
              <span className="terminal-muted">Output</span>
              <div className="terminal-spacer" />
              <button
                className="panel-action"
                title="Clear terminal"
                onClick={() => setTerminalLines([])}
              >
                <Trash2 size={13} />
              </button>
              <button
                className="panel-action"
                title="Maximize terminal"
                onClick={toggleTerminalMax}
              >
                <Maximize2 size={13} />
              </button>
              <button
                className="panel-action"
                title="Close terminal"
                onClick={() => setTerminalOpen(false)}
              >
                <X size={13} />
              </button>
            </div>
            <TerminalOutput lines={terminalLines} />
          </div>
        )}
      </main>
      {rightOpen && (
        <AssistantPanel
          chat={chat}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendChat={sendChat}
          setRightOpen={setRightOpen}
          streams={streams}
        />
      )}
    </div>
  );
}

function TerminalOutput({ lines }: { lines: string[] }) {
  return (
    <div className="terminal-body">
      {lines.map((line, i) => (
        <div
          key={i}
          className={`terminal-line ${line.startsWith("$") ? "cmd" : line.includes("✓") || line.includes("success") ? "success" : line.includes("Running") || line.includes("Validating") ? "info" : ""}`}
        >
          {line.startsWith("$") ? (
            <>
              <span className="terminal-prompt">$</span>
              {line.slice(1)}
            </>
          ) : (
            line
          )}
        </div>
      ))}
    </div>
  );
}

function AssistantPanel({
  chat,
  chatInput,
  setChatInput,
  sendChat,
  setRightOpen,
  streams,
}: {
  chat: ChatMessage[];
  chatInput: string;
  setChatInput: (s: string) => void;
  sendChat: () => void;
  setRightOpen: (v: boolean) => void;
  streams: React.MutableRefObject<Partial<Record<CheckId, MediaStream>>>;
}) {
  const cameraRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (cameraRef.current && streams.current.camera) {
      cameraRef.current.srcObject = streams.current.camera;
      cameraRef.current.play().catch(() => undefined);
    }
  }, [streams]);
  const streamState = (id: CheckId) => Boolean(streams.current[id]);
  return (
    <aside className="right-panel">
      <div className="assistant-head">
        <div className="assistant-icon">
          <Sparkles size={14} />
        </div>
        <div>
          <div className="assistant-title">Assessment Assistant</div>
          <div className="assistant-sub">
            Policy-aware guidance · student mode
          </div>
        </div>
        <div className="head-spacer" />
        <button
          className="panel-action"
          onClick={() => setRightOpen(false)}
          title="Close assistant"
        >
          <PanelRightClose size={14} />
        </button>
      </div>
      <div className="assistant-scroll">
        <div className="monitor-strip">
          <div className="monitor-mini">
            <Camera size={14} />
            <span>Camera</span>
            <b>{streamState("camera") ? "ON" : "OFF"}</b>
          </div>
          <div className="monitor-mini">
            <MonitorUp size={14} />
            <span>Screen</span>
            <b>{streamState("screen") ? "ON" : "OFF"}</b>
          </div>
          <div className="monitor-mini">
            <Volume2 size={14} />
            <span>Voice</span>
            <b>{streamState("voice") ? "ON" : "OFF"}</b>
          </div>
        </div>
        {streamState("camera") && (
          <div className="assistant-camera">
            <video ref={cameraRef} muted playsInline />
            <span>Candidate camera · live preview</span>
          </div>
        )}
        <div className="assistant-note">
          <strong>Guidance only.</strong> This panel can discuss constraints,
          edge cases, and test behavior. It never inserts code or reveals hidden
          tests.
        </div>
        {chat.map((message, i) => (
          <div className={`message ${message.role}`} key={i}>
            <div className={`msg-avatar ${message.role}`}>
              {message.role === "ai" ? <Bot size={12} /> : "PN"}
            </div>
            <div className="bubble">{message.text}</div>
          </div>
        ))}
        <div className="ai-section">Observed session signals</div>
        <div className="signal-row">
          <div className="signal-icon">
            <GitCommitHorizontal size={14} />
          </div>
          <div>
            <div className="signal-name">Incremental development</div>
            <div className="signal-detail">4 checkpoints across 29 minutes</div>
          </div>
        </div>
        <div className="signal-row">
          <div className="signal-icon">
            <AlertTriangle size={14} />
          </div>
          <div>
            <div className="signal-name">1 focus interruption</div>
            <div className="signal-detail">
              Review signal · not a conclusion
            </div>
          </div>
        </div>
      </div>
      <div className="assistant-input">
        <div className="input-box">
          <textarea
            aria-label="Ask assessment assistant"
            placeholder="Ask about constraints or edge cases…"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChat();
              }
            }}
          />
          <button className="send-btn" title="Send" onClick={sendChat}>
            <Send size={13} />
          </button>
        </div>
        <div className="input-hint">
          Enter to send · Shift + Enter for a new line
        </div>
      </div>
    </aside>
  );
}

function Dashboard({
  onOpenDetail,
  onToast,
}: {
  onOpenDetail: () => void;
  onToast: (text: string, tone?: "good" | "warn") => void;
}) {
  return (
    <main className="dashboard">
      <div className="dash-header">
        <div>
          <div className="eyebrow">Evaluator console / overview</div>
          <h1 className="dash-title">
            Review the process, not just the answer.
          </h1>
          <p className="dash-copy">
            Evidence-based assessment insights across active and completed
            sessions.
          </p>
        </div>
        <div className="dash-controls">
          <select className="select-control" defaultValue="7">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <button
            className="toolbar-btn"
            onClick={() => onToast("Report export queued · demo mode", "good")}
          >
            <Download size={13} />
            Export report
          </button>
          <button className="toolbar-btn primary" onClick={onOpenDetail}>
            <Users size={13} />
            Open session review
          </button>
        </div>
      </div>
      <div className="metric-grid">
        <Metric
          label="Total assessments"
          value="24"
          change="+18% vs last cycle"
        />
        <Metric
          label="Active sessions"
          value="08"
          change="3 reconnecting"
          warn
        />
        <Metric label="Completed" value="116" change="+12 this week" />
        <Metric label="Submissions" value="109" change="93.9% completion" />
        <Metric
          label="Review priority"
          value="07"
          change="Evidence review recommended"
          warn
        />
      </div>
      <div className="dash-grid">
        <div>
          <section className="dash-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={Activity}>Session activity</IconLabel>
              </span>
              <span className="status-chip live">
                <span className="dot" />
                LIVE
              </span>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityChart}
                  margin={{ top: 10, right: 14, bottom: 0, left: -14 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#16222f",
                      border: "1px solid #304254",
                      borderRadius: 5,
                      fontSize: 10,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#62a9ff"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#62a9ff", strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="review"
                    stroke="#e9b96d"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#e9b96d", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="dash-card table-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={Users}>Recent students</IconLabel>
              </span>
              <button className="card-link" onClick={onOpenDetail}>
                View all students{" "}
                <ArrowRight size={12} style={{ verticalAlign: "-2px" }} />
              </button>
            </div>
            <table className="student-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>SCORE</th>
                  <th>TIME</th>
                  <th>COMMITS</th>
                  <th>FOCUS</th>
                  <th>INTEGRITY</th>
                  <th>REVIEW</th>
                </tr>
              </thead>
              <tbody>
                <StudentRow
                  initials="PN"
                  name="Priya Nair"
                  color="#d3a77b"
                  score="92"
                  time="31m 08s"
                  commits="4"
                  focus="2"
                  review
                />
                <StudentRow
                  initials="AS"
                  name="Alex Smith"
                  color="#85b6d8"
                  score="88"
                  time="28m 42s"
                  commits="7"
                  focus="0"
                />
                <StudentRow
                  initials="MK"
                  name="Mina Kwon"
                  color="#b69bd9"
                  score="94"
                  time="34m 11s"
                  commits="6"
                  focus="1"
                />
                <StudentRow
                  initials="RJ"
                  name="Rohan Joshi"
                  color="#8dc39f"
                  score="76"
                  time="41m 06s"
                  commits="2"
                  focus="4"
                  review
                />
              </tbody>
            </table>
          </section>
        </div>
        <div className="side-stack">
          <section className="dash-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={Flag}>Review queue</IconLabel>
              </span>
              <span className="card-link">07 open</span>
            </div>
            <div className="review-list">
              <ReviewRow
                initials="PN"
                name="Priya Nair"
                reason="Large change before submit"
                color="#d3a77b"
              />
              <ReviewRow
                initials="RJ"
                name="Rohan Joshi"
                reason="Repeated focus interruptions"
                color="#8dc39f"
              />
              <ReviewRow
                initials="TC"
                name="Tomas Cruz"
                reason="Unusual commit interval"
                color="#d9a5a5"
              />
            </div>
          </section>
          <section className="dash-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={GitBranch}>Code evolution</IconLabel>
              </span>
              <span className="card-link">4 commits</span>
            </div>
            <div className="mini-bars">
              <div className="mini-bar" style={{ height: "23%" }} />
              <div className="mini-bar" style={{ height: "48%" }} />
              <div className="mini-bar" style={{ height: "36%" }} />
              <div className="mini-bar" style={{ height: "70%" }} />
              <div className="mini-bar active" style={{ height: "92%" }} />
            </div>
            <div className="mini-bar-labels">
              <span>14:08</span>
              <span>14:16</span>
              <span>14:27</span>
              <span>14:31</span>
            </div>
          </section>
          <section className="dash-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={ShieldCheck}>Privacy posture</IconLabel>
              </span>
              <span className="status-chip live">
                <span className="dot" />
                MINIMAL
              </span>
            </div>
            <div className="report-copy" style={{ fontSize: 10 }}>
              Browser-observable signals only. No webcam or microphone capture.
              Review indicators are recommendations, never automatic
              conclusions.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  change,
  warn,
}: {
  label: string;
  value: string;
  change: string;
  warn?: boolean;
}) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-change ${warn ? "warn" : ""}`}>{change}</div>
    </div>
  );
}
function StudentRow({
  initials,
  name,
  color,
  score,
  time,
  commits,
  focus,
  review,
}: {
  initials: string;
  name: string;
  color: string;
  score: string;
  time: string;
  commits: string;
  focus: string;
  review?: boolean;
}) {
  return (
    <tr>
      <td>
        <div className="student">
          <span className="student-avatar" style={{ background: color }}>
            {initials}
          </span>
          {name}
        </div>
      </td>
      <td style={{ color: "#e4edf5" }}>{score}%</td>
      <td>{time}</td>
      <td>{commits}</td>
      <td>{focus}</td>
      <td>
        <span className={`integrity ${review ? "review" : "normal"}`}>
          <span className="tiny" />
          {review ? "Review" : "Normal"}
        </span>
      </td>
      <td>
        <button className="card-link">{review ? "Open" : "View"}</button>
      </td>
    </tr>
  );
}
function ReviewRow({
  initials,
  name,
  reason,
  color,
}: {
  initials: string;
  name: string;
  reason: string;
  color: string;
}) {
  return (
    <div className="review-row">
      <span className="review-avatar" style={{ background: color }}>
        {initials}
      </span>
      <div className="review-main">
        <div className="review-name">{name}</div>
        <div className="review-reason">{reason}</div>
      </div>
      <span className="review-priority">P2</span>
    </div>
  );
}

function DetailView({
  onBack,
  onToast,
}: {
  onBack: () => void;
  onToast: (text: string, tone?: "good" | "warn") => void;
}) {
  const [commitIndex, setCommitIndex] = useState(0);
  const detailCommits = initialCommits;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")
        setCommitIndex(i => Math.min(i + 1, detailCommits.length - 1));
      if (e.key === "ArrowRight") setCommitIndex(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [detailCommits.length]);
  const selected = detailCommits[commitIndex];
  return (
    <main className="detail-view">
      <div className="detail-top">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={13} />
          All sessions
        </button>
        <div>
          <h1 className="detail-title">
            Priya Nair{" "}
            <span
              className="status-chip demo"
              style={{ verticalAlign: "3px", marginLeft: 8 }}
            >
              REVIEW RECOMMENDED
            </span>
          </h1>
          <div className="detail-meta">
            session-204 · Algorithms / Spring cohort · completed today at 14:31
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            className="toolbar-btn"
            onClick={() =>
              setCommitIndex(
                Math.min(commitIndex + 1, detailCommits.length - 1)
              )
            }
          >
            <ArrowLeft size={12} />
            Previous commit
          </button>
          <button
            className="toolbar-btn"
            onClick={() => setCommitIndex(Math.max(commitIndex - 1, 0))}
          >
            Next commit
            <ArrowRight size={12} />
          </button>
          <button
            className="toolbar-btn primary"
            onClick={() =>
              onToast("Reviewer note saved to session-204", "good")
            }
          >
            <Check size={13} />
            Mark reviewed
          </button>
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <section className="report-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={Sparkles}>AI interaction report</IconLabel>
              </span>
              <span className="status-chip demo">
                <span className="dot" />
                MOCK PROVIDER
              </span>
            </div>
            <div className="report-copy">
              <p style={{ marginTop: 0 }}>
                <strong style={{ color: "#ecf3f9" }}>Summary.</strong> The
                student initially implemented a brute-force approach and
                transitioned to a hash-map-based solution. Development was
                largely incremental, with several test-and-fix cycles. One large
                code insertion occurred shortly before submission. Two
                focus-loss events were recorded. These signals warrant evaluator
                review but do not independently establish unauthorized activity.
              </p>
              <div>
                <span className="fact-pill">Observed · 4 commits</span>
                <span className="fact-pill">Observed · 2 focus events</span>
                <span className="fact-pill">
                  Inference · incremental pattern
                </span>
                <span className="fact-pill">Confidence · 0.78</span>
              </div>
            </div>
          </section>
          <section className="report-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={History}>Development timeline</IconLabel>
              </span>
              <span className="card-link">← → to replay</span>
            </div>
            <div className="timeline">
              <TimelineRow
                time="14:02:10"
                label="Assessment started"
                detail="Controlled mode entered · browser checks passed"
                kind="good"
              />
              <TimelineRow
                time="14:08:42"
                label="Initial implementation"
                detail="31 lines added · brute-force scan"
              />
              <TimelineRow
                time="14:12:31"
                label="Test execution"
                detail="6 / 8 cases passed"
              />
              <TimelineRow
                time="14:21:09"
                label="Focus lost"
                detail="Browser visibility changed for 8 seconds"
                kind="warn"
              />
              <TimelineRow
                time="14:27:45"
                label="Hash map introduced"
                detail="18 additions · approach optimization"
              />
              <TimelineRow
                time="14:31:02"
                label="Final submission"
                detail="8 / 8 tests passed · checkpoint captured"
                kind="good"
              />
            </div>
          </section>
          <section className="report-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={BarChart3}>Code evolution</IconLabel>
              </span>
              <span className="card-link">{selected.id} selected</span>
            </div>
            <div style={{ height: 170, padding: "10px 12px 5px 0" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={commitsChart}
                  margin={{ top: 5, right: 14, bottom: 0, left: -18 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#16222f",
                      border: "1px solid #304254",
                      borderRadius: 5,
                      fontSize: 10,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="churn"
                    stroke="#62a9ff"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#62a9ff", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
        <div>
          <section className="report-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={ShieldCheck}>Integrity indicators</IconLabel>
              </span>
            </div>
            <div className="report-copy">
              <Indicator
                title="Incremental development"
                detail="4 meaningful checkpoints across 29 minutes"
                tone="good"
              />
              <Indicator
                title="Large change near submission"
                detail="12 additions · 4 deletions at 14:31"
                tone="warn"
              />
              <Indicator
                title="Focus interruptions"
                detail="2 visibility events · 8s and 11s"
                tone="warn"
              />
              <Indicator
                title="Test / fix cycle"
                detail="2 failed cases before final pass"
                tone="good"
              />
            </div>
          </section>
          <section className="report-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={GitCommitHorizontal}>
                  Selected commit
                </IconLabel>
                <span
                  style={{
                    font: "10px 'DM Mono'",
                    color: "#6d7d8d",
                    marginLeft: 7,
                  }}
                >
                  {selected.id}
                </span>
              </span>
              <button
                className="panel-action"
                onClick={() => onToast("Diff copied to clipboard", "good")}
              >
                <Copy size={13} />
              </button>
            </div>
            <div className="report-copy">
              <div
                style={{ color: "#dce7ef", fontWeight: 600, marginBottom: 7 }}
              >
                {selected.message}
              </div>
              <div style={{ color: "#6f8191", fontSize: 10, marginBottom: 10 }}>
                {selected.time} · {selected.problem}
              </div>
              <div
                style={{
                  background: "#0b1219",
                  border: "1px solid var(--line-soft)",
                  borderRadius: 5,
                  padding: 10,
                  font: "10px/18px 'DM Mono'",
                }}
              >
                <div style={{ color: "#76d4a6" }}>
                  + const complement = target - nums[i];
                </div>
                <div style={{ color: "#76d4a6" }}>
                  + if (seen.has(complement)) return …
                </div>
                <div style={{ color: "#ed8c8c" }}>
                  - for (let j = i + 1; j &lt; nums.length; j++) …
                </div>
              </div>
            </div>
          </section>
          <section className="report-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={Info}>Limitations</IconLabel>
              </span>
            </div>
            <div className="report-copy" style={{ fontSize: 10 }}>
              Browser events cannot observe every OS-level application switch or
              guarantee exclusive device use. This report explains evidence for
              review; it does not determine misconduct.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
function TimelineRow({
  time,
  label,
  detail,
  kind,
}: {
  time: string;
  label: string;
  detail: string;
  kind?: "warn" | "good";
}) {
  return (
    <div className="timeline-item">
      <div className="timeline-time">{time}</div>
      <div className="timeline-line">
        <span className={`timeline-dot ${kind || ""}`} />
      </div>
      <div>
        <div className="timeline-label">{label}</div>
        <div className="timeline-desc">{detail}</div>
      </div>
    </div>
  );
}
function Indicator({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: "good" | "warn";
}) {
  return (
    <div
      style={{ padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}
    >
      <div
        style={{
          color: tone === "good" ? "#98e2cd" : "#edca91",
          fontSize: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {tone === "good" ? (
          <CheckCircle2 size={12} />
        ) : (
          <AlertTriangle size={12} />
        )}
        {title}
      </div>
      <div style={{ color: "#758696", fontSize: 9, marginTop: 4 }}>
        {detail}
      </div>
    </div>
  );
}

type AssessmentDefinition = {
  id: string;
  title: string;
  kind: "aptitude" | "coding" | "project";
  duration: string;
  due: string;
  description: string;
  progress: string;
  icon: typeof Code2;
  accent: string;
};
type LiveAssessmentAssignment = {
  assignmentId: number;
  assessmentId: number;
  title: string;
  status: string;
  sections: Array<{
    id: number;
    title: string;
    type: "aptitude" | "coding" | "project";
    durationMinutes: number;
    questionCount: number | null;
    sortOrder: number;
  }>;
};
type LiveAttempt = {
  id: number;
  sessionId?: number | null;
  sectionId?: number | null;
  status: string;
  deadlineAt?: string | Date | null;
};

function sectionToAssessment(
  assignment: LiveAssessmentAssignment,
  section: LiveAssessmentAssignment["sections"][number]
): AssessmentDefinition {
  const icon =
    section.type === "aptitude"
      ? ListChecks
      : section.type === "coding"
        ? Code2
        : Bug;
  const accent =
    section.type === "aptitude"
      ? "#e9b96d"
      : section.type === "coding"
        ? "#62a9ff"
        : "#a897f2";
  const duration =
    section.durationMinutes >= 60
      ? `${Math.floor(section.durationMinutes / 60)} hour${section.durationMinutes >= 120 ? "s" : ""}`
      : `${section.durationMinutes} minutes`;
  const detail =
    section.type === "aptitude"
      ? `${section.questionCount ?? 30} timed questions`
      : section.type === "coding"
        ? `${section.questionCount ?? 3} programming problems`
        : "Frontend + backend debugging";
  return {
    id: String(section.id),
    title: section.title,
    kind: section.type,
    duration,
    due: "Single sitting · sequential stage",
    description: detail,
    progress: "Not started",
    icon,
    accent,
  };
}

function BrandHeader({
  theme,
  toggleTheme,
  onSignIn,
}: {
  theme: string;
  toggleTheme?: () => void;
  onSignIn?: () => void;
}) {
  return (
    <header className="landing-nav">
      <a
        className="landing-brand"
        href="#top"
        aria-label="Assessment Workbench home"
      >
        <span className="brand-mark">A</span>
        <span>
          <span className="brand-name">ASSESSMENT WORKBENCH</span>
          <span className="brand-sub">evidence-first assessments</span>
        </span>
      </a>
      {onSignIn && (
        <nav className="landing-links" aria-label="Primary navigation">
          <a href="#workflow">Workflow</a>
          <a href="#evidence">Evidence</a>
          <a href="#security">Security</a>
        </nav>
      )}
      <div className="landing-nav-actions">
        <button
          className="icon-btn landing-theme"
          title="Toggle theme"
          aria-label="Toggle theme"
          onClick={() => toggleTheme?.()}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {onSignIn && (
          <button className="landing-signin" onClick={onSignIn}>
            Sign in <ArrowRight size={14} />
          </button>
        )}
      </div>
    </header>
  );
}

function WorkbenchHeroVisual() {
  return (
    <div
      className="hero-visual"
      aria-label="Assessment Workbench product preview"
    >
      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />
      <div className="workbench-window">
        <div className="window-chrome">
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <div className="window-title">
            <span className="window-title-mark">A</span>Assessment Workbench{" "}
            <span>/</span> Algorithms · Spring cohort
          </div>
          <div className="window-actions">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="window-body">
          <aside className="hero-sidebar">
            <div className="hero-sidebar-head">
              <span>ASSESSMENT</span>
              <MoreHorizontal size={13} />
            </div>
            <div className="hero-search">
              <Search size={12} /> Search
            </div>
            <div className="hero-nav-item active">
              <Code2 size={13} /> Coding workspace
            </div>
            <div className="hero-nav-item">
              <ClipboardList size={13} /> Problems <b>04</b>
            </div>
            <div className="hero-nav-item">
              <GitBranch size={13} /> Evidence
            </div>
            <div className="hero-nav-item">
              <BarChart3 size={13} /> Evaluator
            </div>
            <div className="hero-nav-spacer" />
            <div className="hero-user">
              <span>PN</span>
              <div>
                <strong>Priya Nair</strong>
                <small>candidate</small>
              </div>
            </div>
          </aside>
          <main className="hero-editor">
            <div className="hero-editor-tabs">
              <span className="active">
                <FileCode2 size={12} />
                solution.ts
              </span>
              <span>tests.ts</span>
              <span>README.md</span>
            </div>
            <div className="hero-breadcrumb">
              workspace <ChevronRight size={10} /> coding{" "}
              <ChevronRight size={10} /> <b>solution.ts</b>
              <span className="hero-live">
                <i /> LIVE
              </span>
            </div>
            <div className="hero-code">
              <div className="hero-gutter">
                {Array.from({ length: 14 }, (_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              <pre>
                <span className="hc-purple">function</span>{" "}
                <span className="hc-blue">twoSum</span>(nums, target) {"{"}
                {`\n`} <span className="hc-purple">const</span> seen ={" "}
                <span className="hc-purple">new</span> Map();{`\n\n`}{" "}
                <span className="hc-purple">for</span> (
                <span className="hc-purple">let</span> i = 0; i &lt;
                nums.length; i++) {"{"}
                {`\n`} <span className="hc-purple">const</span> complement =
                target - nums[i];{`\n\n`} <span className="hc-purple">if</span>{" "}
                (seen.has(complement)) {"{"}
                {`\n`} <span className="hc-purple">return</span>{" "}
                [seen.get(complement), i];{`\n`} {"}"}
                {`\n`} {"}"}
                {`\n\n`} <span className="hc-purple">return</span> [];{`\n`}
                {"}"}
              </pre>
            </div>
            <div className="hero-terminal">
              <div>
                <span className="terminal-prompt">›</span> pnpm test
              </div>
              <span className="terminal-ok">✓ 18 passed</span>
              <span>2.41s</span>
            </div>
          </main>
          <aside className="hero-insights">
            <div className="hero-insight-head">
              <div>
                <span className="eyebrow">LIVE REVIEW</span>
                <strong>Evidence</strong>
              </div>
              <span className="hero-secure">
                <ShieldCheck size={12} /> secure
              </span>
            </div>
            <div className="hero-score">
              <div>
                <span>solution quality</span>
                <strong>92</strong>
                <small>/100</small>
              </div>
              <div className="score-ring">
                <span>92%</span>
              </div>
            </div>
            <div className="hero-insight-card">
              <div className="insight-icon">
                <GitBranch size={13} />
              </div>
              <div>
                <strong>Incremental development</strong>
                <span>4 meaningful checkpoints</span>
              </div>
              <CheckCircle2 size={14} />
            </div>
            <div className="hero-insight-card">
              <div className="insight-icon amber">
                <Clock3 size={13} />
              </div>
              <div>
                <strong>Focus interruption</strong>
                <span>8s visibility change</span>
              </div>
              <Info size={14} />
            </div>
            <div className="hero-ai-card">
              <div className="ai-card-top">
                <Sparkles size={13} />
                <span>AI evaluator</span>
                <span className="ai-dot" />
              </div>
              <p>
                Development looks largely incremental. One late change deserves
                human review.
              </p>
              <div className="ai-tags">
                <span>Observed</span>
                <span>Inference</span>
                <span>Human review</span>
              </div>
            </div>
          </aside>
        </div>
        <div className="window-status">
          <span>
            <CheckCircle2 size={11} /> All systems ready
          </span>
          <span>
            <LockKeyhole size={11} /> Protected session
          </span>
          <span className="status-right">2h 00m remaining</span>
        </div>
      </div>
      <div className="hero-float hero-float-one">
        <Sparkles size={13} />
        <span>AI-assisted review</span>
        <b>context, not conclusions</b>
      </div>
      <div className="hero-float hero-float-two">
        <ShieldCheck size={13} />
        <span>Privacy-aware</span>
        <b>browser signals only</b>
      </div>
    </div>
  );
}

function LoginView({
  theme,
  toggleTheme,
}: {
  theme: string;
  toggleTheme?: () => void;
}) {
  const [showSignIn, setShowSignIn] = useState(false);
  const [providers, setProviders] = useState({
    oidc: false,
    github: false,
    google: false,
    microsoft: false,
    email: false,
  });
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get(
      "auth_error"
    );
    if (authError) {
      toast.error(authError);
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.hash
      );
    }

    let cancelled = false;
    fetch("/api/auth/providers", { credentials: "include" })
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (!cancelled && data) setProviders(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const begin = (provider: "github" | "oidc" | "google" | "microsoft") => {
    if (!providers[provider]) {
      toast.error(
        `${provider === "oidc" ? "Institution SSO" : provider[0].toUpperCase() + provider.slice(1)} is not configured yet.`
      );
      return;
    }
    startProviderLogin(provider);
  };

  const requestEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!providers.email) {
      toast.error("Email sign-in is not configured yet.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setEmailSending(true);
    setEmailSent(false);

    try {
      const response = await fetch("/api/auth/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Could not send the sign-in link.");
      }

      setEmailSent(true);
      toast.success("Sign-in link sent. Check your email.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not send the sign-in link."
      );
    } finally {
      setEmailSending(false);
    }
  };

  const scrollToSignIn = () => {
    setShowSignIn(true);
    window.setTimeout(
      () =>
        document
          .getElementById("sign-in")
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      30
    );
  };

  return (
    <div className="landing-page" id="top">
      <BrandHeader
        theme={theme}
        toggleTheme={toggleTheme}
        onSignIn={scrollToSignIn}
      />
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" /> Evidence-first assessment
              platform <span>·</span> built for real evaluation
            </div>
            <h1>
              See how candidates <em>think, build,</em> and solve.
            </h1>
            <p className="hero-lede">
              Assessment Workbench combines timed assessments, a controlled
              coding workspace, and explainable evidence so evaluators can
              review the process — not just the final answer.
            </p>
            <div className="hero-cta-row">
              <button className="hero-primary" onClick={scrollToSignIn}>
                Start an assessment <ArrowRight size={15} />
              </button>
              <a className="hero-secondary" href="#workflow">
                Explore the workflow <ArrowRight size={14} />
              </a>
            </div>
            <div className="hero-trust-row">
              <span>
                <ShieldCheck size={14} /> Privacy-aware
              </span>
              <span>
                <GitBranch size={14} /> Code evolution
              </span>
              <span>
                <Sparkles size={14} /> AI-assisted review
              </span>
            </div>
          </div>
          <WorkbenchHeroVisual />
        </section>

        <section className="landing-proof" aria-label="Platform capabilities">
          <div>
            <strong>01</strong>
            <span>One controlled workspace</span>
          </div>
          <div>
            <strong>02</strong>
            <span>Evidence separated from inference</span>
          </div>
          <div>
            <strong>03</strong>
            <span>Human review stays in the loop</span>
          </div>
          <div>
            <strong>04</strong>
            <span>Light and dark themes, built in</span>
          </div>
        </section>

        <section className="landing-section" id="workflow">
          <div className="section-heading">
            <span className="eyebrow">A calmer assessment workflow</span>
            <h2>Everything a serious assessment needs, without the clutter.</h2>
            <p>
              Designed around the candidate experience first, then the evidence
              an evaluator actually needs.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-card-large">
              <div className="feature-number">01</div>
              <div className="feature-icon">
                <Code2 size={19} />
              </div>
              <h3>Work where the solution happens</h3>
              <p>
                Coding, aptitude, and project assessments live inside one
                focused workspace with timers, tests, checkpoints, and clear
                submission states.
              </p>
              <div className="feature-mini-ui">
                <span className="mini-pill active">
                  <i />
                  LIVE
                </span>
                <span>solution.ts</span>
                <span>18 tests</span>
                <span>02:14:08</span>
              </div>
            </article>
            <article className="feature-card">
              <div className="feature-number">02</div>
              <div className="feature-icon">
                <GitBranch size={19} />
              </div>
              <h3>Capture the development story</h3>
              <p>
                Meaningful checkpoints and focus events turn a final submission
                into a reviewable timeline.
              </p>
              <div className="mini-timeline">
                <i />
                <i />
                <i />
                <i />
              </div>
            </article>
            <article className="feature-card">
              <div className="feature-number">03</div>
              <div className="feature-icon">
                <Sparkles size={19} />
              </div>
              <h3>Use AI as a reviewer's assistant</h3>
              <p>
                Summaries distinguish observed facts from inferences and surface
                where human attention is useful.
              </p>
              <div className="mini-ai">
                <Sparkles size={12} /> Incremental development · 0.91 confidence
              </div>
            </article>
          </div>
        </section>

        <section className="landing-evidence" id="evidence">
          <div className="evidence-copy">
            <span className="eyebrow">Evidence, not surveillance theatre</span>
            <h2>
              Make the review <em>defensible.</em>
            </h2>
            <p>
              Signals are contextual. A focus change is a focus change — not
              proof of misconduct. Assessment Workbench keeps observations,
              inferences, and recommendations visibly separate.
            </p>
            <div className="evidence-points">
              <span>
                <CheckCircle2 size={15} />
                Observed facts stay explicit
              </span>
              <span>
                <CheckCircle2 size={15} />
                Recommendations require human judgment
              </span>
              <span>
                <CheckCircle2 size={15} />
                No webcam or microphone recording stored
              </span>
            </div>
          </div>
          <div className="evidence-report">
            <div className="report-window-top">
              <span>session-204</span>
              <span className="status-chip live">
                <i />
                REVIEW READY
              </span>
            </div>
            <div className="report-score-row">
              <div>
                <small>Review priority</small>
                <strong>Recommended</strong>
              </div>
              <div className="report-bars">
                <span style={{ width: "86%" }} />
                <span style={{ width: "62%" }} />
                <span style={{ width: "34%" }} />
              </div>
            </div>
            <div className="report-facts">
              <div>
                <span>Observed</span>
                <strong>4 commits</strong>
              </div>
              <div>
                <span>Observed</span>
                <strong>2 focus events</strong>
              </div>
              <div>
                <span>Inference</span>
                <strong>Incremental pattern</strong>
              </div>
            </div>
            <div className="report-footer">
              <ShieldCheck size={13} /> Browser-observable signals only{" "}
              <span>·</span> Human review required
            </div>
          </div>
        </section>

        <section className="landing-section landing-security" id="security">
          <div className="security-card">
            <div className="security-icon">
              <LockKeyhole size={20} />
            </div>
            <div>
              <span className="eyebrow">Secure by default</span>
              <h2>Authentication stays outside your assessment UI.</h2>
              <p>
                OAuth state is bound to the browser, sessions use HTTP-only
                cookies, and provider credentials never touch the client.
              </p>
            </div>
            <div className="security-badges">
              <span>
                <ShieldCheck size={13} /> HTTP-only session
              </span>
              <span>
                <Globe2 size={13} /> OAuth providers
              </span>
              <span>
                <LockKeyhole size={13} /> CSRF state checks
              </span>
            </div>
          </div>
        </section>

        <section
          className={`landing-signin-section ${showSignIn ? "is-open" : ""}`}
          id="sign-in"
        >
          <div className="signin-shell">
            <div className="signin-copy">
              <span className="eyebrow">Candidate access</span>
              <h2>Ready when your assessment is.</h2>
              <p>
                Sign in with your institution or one of the enabled identity
                providers. You will return directly to your assigned workspace.
              </p>
              <div className="signin-note">
                <ShieldCheck size={14} />
                <span>
                  We never ask for your provider password inside Assessment
                  Workbench.
                </span>
              </div>
            </div>
            <section className="login-card landing-login-card">
              <div className="login-card-head">
                <div className="assistant-icon">
                  <LockKeyhole size={15} />
                </div>
                <div>
                  <h2>Sign in securely</h2>
                  <p>Choose how you'd like to sign in.</p>
                </div>
              </div>
              <button
                className={`auth-primary ${!providers.oidc ? "is-disabled" : ""}`}
                onClick={() => begin("oidc")}
              >
                <LogIn size={15} />
                Continue with Institution SSO{" "}
                {!providers.oidc && (
                  <span className="provider-state">Not configured</span>
                )}
              </button>
              <div className="auth-or">
                <span />
                other providers
                <span />
              </div>
              <div className="auth-provider-grid">
                <button
                  className={`auth-secondary ${!providers.github ? "provider-disabled" : ""}`}
                  onClick={() => begin("github")}
                >
                  <Github size={15} />
                  GitHub
                </button>
                <button
                  className={`auth-secondary ${!providers.google ? "provider-disabled" : ""}`}
                  onClick={() => begin("google")}
                >
                  <Globe2 size={15} />
                  Google
                </button>
                {providers.microsoft && (
                  <button
                    className={`auth-secondary ${!providers.microsoft ? "provider-disabled" : ""}`}
                    onClick={() => begin("microsoft")}
                  >
                    <BriefcaseBusiness size={15} />
                    Microsoft
                  </button>
                )}
              </div>
              <div className="auth-or">
                <span />
                or use email
                <span />
              </div>
              <form className="email-login" onSubmit={requestEmailSignIn}>
                <label className="field-label" htmlFor="sign-in-email">
                  Email address
                </label>
                <div className="field-wrap">
                  <Mail size={14} />
                  <input
                    id="sign-in-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={event => {
                      setEmail(event.target.value);
                      setEmailSent(false);
                    }}
                    disabled={!providers.email || emailSending}
                    required
                  />
                </div>
                <button
                  className="auth-primary email-submit"
                  type="submit"
                  disabled={!providers.email || emailSending || !email.trim()}
                >
                  {emailSending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Mail size={14} />
                  )}
                  {emailSending ? "Sending link…" : "Send magic link"}
                </button>
                {emailSent && (
                  <p className="email-status">
                    Check your inbox for a secure sign-in link. It expires in 10
                    minutes and can only be used once.
                  </p>
                )}
              </form>

              <p className="auth-foot">
                <ShieldCheck size={12} /> OAuth state validation · secure
                session cookie · verified identity
              </p>
            </section>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <span>ASSESSMENT WORKBENCH</span>
        <span>Evidence-first evaluation for modern teams.</span>
        <span>Built for focused assessment.</span>
      </footer>
    </div>
  );
}

function AssignmentView({
  assignment,
  onSelect,
  onLogout,
  theme,
  toggleTheme,
  user,
}: {
  assignment?: LiveAssessmentAssignment;
  onSelect: () => void;
  onLogout: () => void;
  theme: string;
  toggleTheme?: () => void;
  user?: { name?: string | null; email?: string | null } | null;
}) {
  const displayName =
    user?.name?.trim() || user?.email?.split("@")[0] || "Candidate";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join("") || "C";

  return (
    <div className="auth-shell">
      <BrandHeader theme={theme} toggleTheme={toggleTheme} />
      <main className="assign-main">
        <div className="assign-heading">
          <div>
            <div className="eyebrow">Candidate workspace</div>
            <h1 className="assignment-page-title">Your assigned assessment</h1>
            <p className="assignment-page-subtitle">
              Welcome, {displayName}! Complete all stages in one supervised
              sitting. Each stage has its own server-controlled timer.
            </p>
          </div>
          <button className="back-btn" onClick={onLogout}>
            <LogIn size={13} />
            Sign out
          </button>
        </div>
        <div className="candidate-strip">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{user?.email || "Candidate account"}</span>
          </div>
          <span className="status-chip live" style={{ marginLeft: "auto" }}>
            <span className="dot" />
            Account verified
          </span>
        </div>
        {assignment ? (
          <div className="assignment-grid">
            <button className="assignment-card" onClick={onSelect}>
              <div className="assignment-card-top">
                <div
                  className="assignment-icon"
                  style={{
                    color: "#62a9ff",
                    borderColor: "#62a9ff40",
                    background: "#62a9ff12",
                  }}
                >
                  <ClipboardList size={18} />
                </div>
                <span className="assignment-kind">SUPERVISED ASSESSMENT</span>
              </div>
              <h2>{assignment.title}</h2>
              <p>
                Three sequential stages. Once the sitting starts, stages are
                completed in order and cannot be reopened.
              </p>
              <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                {[...assignment.sections]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((section, index) => {
                    const a = sectionToAssessment(assignment, section);
                    const Icon = a.icon;
                    return (
                      <div
                        key={section.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 11px",
                          border: "1px solid var(--line-soft)",
                          borderRadius: 6,
                        }}
                      >
                        <Icon
                          size={14}
                          style={{ color: a.accent, flexShrink: 0 }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong style={{ display: "block", fontSize: 11 }}>
                            {index + 1}. {section.title}
                          </strong>
                          <span
                            style={{
                              display: "block",
                              marginTop: 3,
                              color: "#718292",
                              fontSize: 9,
                            }}
                          >
                            {section.type === "aptitude"
                              ? `${section.questionCount ?? 30} questions`
                              : section.type === "coding"
                                ? `${section.questionCount ?? 3} coding problems`
                                : "Bug hunt"}{" "}
                            · {section.durationMinutes} min
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="assignment-footer" style={{ marginTop: 14 }}>
                <span>Ready to begin · all three stages</span>
                <span className="assignment-open">
                  Open assessment <ArrowRight size={13} />
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div className="assignment-note">
            <Info size={14} />
            <span>
              No published assessment is currently assigned to this account.
            </span>
          </div>
        )}
        <div className="assignment-note">
          <Info size={14} />
          <span>
            Camera, microphone, screen-share, tab control, and internet checks
            are mandatory before the first stage. Stage deadlines are enforced
            by the server.
          </span>
        </div>
      </main>
    </div>
  );
}

type CheckId = "camera" | "voice" | "tabs" | "screen" | "internet";
function PreflightView({
  assessment,
  onReady,
  onBack,
  theme,
  toggleTheme,
  streams,
}: {
  assessment: AssessmentDefinition;
  onReady: (checks: Record<CheckId, boolean>) => void;
  onBack: () => void;
  theme: string;
  toggleTheme?: () => void;
  streams: React.MutableRefObject<Partial<Record<CheckId, MediaStream>>>;
}) {
  const [checks, setChecks] = useState<Record<CheckId, boolean>>({
    camera: false,
    voice: false,
    tabs: false,
    screen: false,
    internet: false,
  });
  const [running, setRunning] = useState<CheckId | null>(null);
  const [error, setError] = useState("");
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const allPassed = Object.values(checks).every(Boolean);
  const setPassed = (id: CheckId) =>
    setChecks(current => ({ ...current, [id]: true }));
  const runCheck = async (id: CheckId) => {
    setRunning(id);
    setError("");
    try {
      if (
        (id === "camera" || id === "voice") &&
        !navigator.mediaDevices?.getUserMedia
      )
        throw new Error("media-unavailable");
      if (id === "screen" && !navigator.mediaDevices?.getDisplayMedia)
        throw new Error("screen-unavailable");
      if (
        (id === "camera" || id === "voice") &&
        navigator.mediaDevices?.getUserMedia
      ) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: id === "camera",
          audio: id === "voice",
        });
        streams.current[id] = stream;
        stream.getTracks().forEach(track =>
          track.addEventListener("ended", () => {
            if (streams.current[id] === stream) delete streams.current[id];
          })
        );
        if (id === "camera" && cameraPreviewRef.current) {
          cameraPreviewRef.current.srcObject = stream;
          await cameraPreviewRef.current.play().catch(() => undefined);
        }
      }
      if (id === "screen" && navigator.mediaDevices?.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        streams.current[id] = stream;
        stream.getTracks().forEach(track =>
          track.addEventListener("ended", () => {
            if (streams.current[id] === stream) delete streams.current[id];
          })
        );
      }
      if (id === "internet") {
        if (!navigator.onLine) throw new Error("offline");
        const started = performance.now();
        const response = await fetch(window.location.origin, {
          method: "HEAD",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("network");
        const latency = Math.round(performance.now() - started);
        if (latency > 2500) throw new Error("slow");
      }
      if (id === "tabs") {
        if (document.visibilityState !== "visible")
          throw new Error("Keep this assessment tab visible.");
      }
      setPassed(id);
    } catch (e) {
      setError(
        id === "screen"
          ? "Screen sharing was not granted. Allow it to continue."
          : id === "camera"
            ? "Camera permission is required for this assessment."
            : id === "voice"
              ? "Microphone permission is required for voice monitoring."
              : "Check could not be completed. Try again."
      );
    }
    setRunning(null);
  };
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") setPassed("tabs");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  const checkRows: {
    id: CheckId;
    label: string;
    detail: string;
    icon: typeof Camera;
  }[] = [
    {
      id: "camera",
      label: "Camera and face framing",
      detail: "Camera on · clear front-facing image · no blur or side profile",
      icon: Camera,
    },
    {
      id: "voice",
      label: "Microphone / voice check",
      detail: "Microphone available for privacy-aware speech activity signals",
      icon: Mic,
    },
    {
      id: "tabs",
      label: "Controlled assessment tab",
      detail:
        "Assessment tab visible · tab changes are logged where browser permits",
      icon: Eye,
    },
    {
      id: "screen",
      label: "Screen sharing",
      detail: "Share the assessment window or full screen for the session",
      icon: MonitorUp,
    },
    {
      id: "internet",
      label: "Internet connection",
      detail: "Stable connection and latency check",
      icon: Gauge,
    },
  ];
  return (
    <div className="auth-shell">
      <BrandHeader theme={theme} toggleTheme={toggleTheme} />
      <main className="preflight-main">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={13} />
          Back to assessments
        </button>
        <div className="preflight-heading">
          <div>
            <div className="eyebrow">Required before launch</div>
            <h1>System check</h1>
            <p>
              Before <strong>{assessment.title}</strong> begins, confirm every
              required capability. The start button stays locked until all
              checks pass.
            </p>
          </div>
          <span className="status-chip demo">
            <span className="dot" />
            {assessment.duration}
          </span>
        </div>
        <div className="preflight-layout">
          <section className="preflight-card">
            <div className="card-head">
              <span className="card-title">
                <IconLabel icon={ShieldCheck}>Assessment readiness</IconLabel>
              </span>
              <span className={`status-chip ${allPassed ? "live" : "demo"}`}>
                <span className="dot" />
                {allPassed
                  ? "READY"
                  : `${Object.values(checks).filter(Boolean).length} / 5 PASSED`}
              </span>
            </div>
            <div className="check-list">
              {checkRows.map(row => {
                const Icon = row.icon;
                return (
                  <div
                    className={`check-row ${checks[row.id] ? "passed" : ""}`}
                    key={row.id}
                  >
                    <div className="check-icon">
                      <Icon size={16} />
                    </div>
                    <div className="check-copy">
                      <strong>{row.label}</strong>
                      <span>{row.detail}</span>
                    </div>
                    {checks[row.id] ? (
                      <CheckCircle2 color="#55d6b0" size={18} />
                    ) : (
                      <button
                        className="check-action"
                        onClick={() => runCheck(row.id)}
                        disabled={running !== null}
                      >
                        {running === row.id ? "Checking…" : "Run check"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {error && (
              <div className="preflight-error">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
            <div className="preflight-actions">
              <button
                className="toolbar-btn"
                onClick={() => {
                  setChecks({
                    camera: false,
                    voice: false,
                    tabs: false,
                    screen: false,
                    internet: false,
                  });
                  setError("");
                }}
              >
                <RotateCcw size={13} />
                Reset checks
              </button>
              <button
                className="auth-primary"
                disabled={!allPassed}
                onClick={() => onReady(checks)}
              >
                {allPassed
                  ? "Enter assessment"
                  : "Complete all checks to continue"}
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
          <aside className="preflight-side">
            <div className="monitor-preview">
              <div className="monitor-label">
                <Camera size={13} />
                Candidate preview
              </div>
              <div className="preview-silhouette">
                <video
                  ref={cameraPreviewRef}
                  className="camera-video"
                  muted
                  playsInline
                />
                <UserCheck className="preview-fallback" size={46} />
              </div>
              <span className="preview-status">
                Camera preview stays active after permission
              </span>
            </div>
            <div className="privacy-box">
              <ShieldCheck size={15} />
              <div>
                <strong>Privacy-aware by design</strong>
                <p>
                  No webcam or microphone recording is stored.
                  Browser-observable assessment signals are collected only for
                  this session and explained in the evaluator report.
                </p>
              </div>
            </div>
            <div className="privacy-box">
              <Info size={15} />
              <div>
                <strong>Browser limitation</strong>
                <p>
                  Normal websites cannot guarantee OS-level app detection or
                  prevent another device. Stronger lockdown requires a managed
                  desktop shell.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MonitoringChips({
  streams,
}: {
  streams: React.MutableRefObject<Partial<Record<CheckId, MediaStream>>>;
}) {
  const active = (id: CheckId) => Boolean(streams.current[id]);
  return (
    <div className="mode-monitoring">
      <span>
        <Camera size={12} />
        Camera {active("camera") ? "ON" : "OFF"}
      </span>
      <span>
        <MonitorUp size={12} />
        Screen {active("screen") ? "ON" : "OFF"}
      </span>
      <span>
        <Volume2 size={12} />
        Voice {active("voice") ? "ON" : "OFF"}
      </span>
    </div>
  );
}

function formatRemaining(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`;
}

function AptitudeView({
  assessment,
  onSubmit,
  onBack,
  streams,
  remainingSeconds,
}: {
  assessment: AssessmentDefinition;
  onSubmit: () => void;
  onBack: () => void;
  streams: React.MutableRefObject<Partial<Record<CheckId, MediaStream>>>;
  remainingSeconds: number;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const questions = [
    {
      q: "A train travels 240 km in 3 hours. What is its average speed?",
      options: ["60 km/h", "80 km/h", "90 km/h", "120 km/h"],
    },
    { q: "If 5x + 7 = 32, what is x?", options: ["3", "5", "7", "9"] },
    {
      q: "Which number completes the sequence: 2, 6, 12, 20, __?",
      options: ["24", "28", "30", "32"],
    },
  ];
  return (
    <div className="mode-shell">
      <div className="mode-top">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">ASSESSMENT WORKBENCH</div>
            <div className="brand-sub">
              {assessment.title} · controlled session
            </div>
          </div>
        </div>
        <div className="mode-center">
          <span className="status-chip live">
            <span className="dot" />
            PROCTORED
          </span>
          <MonitoringChips streams={streams} />
          <span className="top-timer">
            <span className="timer-dot" />
            {formatRemaining(remainingSeconds)}
          </span>
        </div>
        <button className="toolbar-btn" onClick={onBack}>
          <ArrowLeft size={13} />
          Exit
        </button>
      </div>
      <div className="mode-body">
        <aside className="question-nav">
          <div className="panel-kicker">Questions · 03 / 30</div>
          <div className="question-grid">
            {Array.from({ length: 30 }, (_, i) => (
              <button
                key={i}
                className={answers[i] ? "answered" : i === 2 ? "current" : ""}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="question-legend">
            <span>
              <i className="legend-current" />
              Current
            </span>
            <span>
              <i className="legend-answer" />
              Answered
            </span>
          </div>
        </aside>
        <main className="question-main">
          <div className="mode-heading">
            <div>
              <div className="eyebrow">Quantitative aptitude</div>
              <h1>{assessment.title}</h1>
            </div>
            <span className="status-chip demo">
              <Timer size={12} />
              Question 3 of 30
            </span>
          </div>
          {questions.map((item, index) => (
            <section
              className={`mcq-card ${index === 2 ? "current-card" : ""}`}
              key={item.q}
            >
              <div className="mcq-number">Q{index + 1}</div>
              <h2>{item.q}</h2>
              <div className="options">
                {item.options.map(option => (
                  <label
                    className={answers[index] === option ? "selected" : ""}
                    key={option}
                  >
                    <input
                      type="radio"
                      name={`q-${index}`}
                      checked={answers[index] === option}
                      onChange={() =>
                        setAnswers(current => ({ ...current, [index]: option }))
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </section>
          ))}
          <div className="submit-bar">
            <span>
              <CheckCircle2 size={14} color="#55d6b0" />
              {Object.keys(answers).length} answered ·{" "}
              {30 - Object.keys(answers).length} remaining
            </span>
            <button className="auth-primary" onClick={onSubmit}>
              <Flag size={14} />
              Submit aptitude assessment
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProjectView({
  assessment,
  onSubmit,
  onBack,
  streams,
  remainingSeconds,
}: {
  assessment: AssessmentDefinition;
  onSubmit: () => void;
  onBack: () => void;
  streams: React.MutableRefObject<Partial<Record<CheckId, MediaStream>>>;
  remainingSeconds: number;
}) {
  const [fixed, setFixed] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    "I can help you reason about the bug without directly rewriting your code. Start by checking the API response shape.",
  ]);
  const [activeFile, setActiveFile] = useState("api/routes/users.ts");
  const files = [
    "frontend/src/pages/Users.tsx",
    "frontend/src/components/UserTable.tsx",
    "api/routes/users.ts",
    "api/services/userService.ts",
    "README.md",
  ];
  return (
    <div className="mode-shell">
      <div className="mode-top">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">ASSESSMENT WORKBENCH</div>
            <div className="brand-sub">
              {assessment.title} · full-stack debugging
            </div>
          </div>
        </div>
        <div className="mode-center">
          <span className="status-chip live">
            <span className="dot" />
            PROCTORED
          </span>
          <span className="bug-progress">
            <Bug size={13} />
            {fixed} of 12 bugs fixed
          </span>
          <MonitoringChips streams={streams} />
          <span className="top-timer">
            <span className="timer-dot" />
            {formatRemaining(remainingSeconds)}
          </span>
        </div>
        <button className="toolbar-btn" onClick={onBack}>
          <ArrowLeft size={13} />
          Exit
        </button>
      </div>
      <div className="project-body">
        <aside className="project-files">
          <div className="panel-head">
            <span className="panel-kicker">Project files</span>
            <button className="panel-action">
              <MoreHorizontal size={14} />
            </button>
          </div>
          {files.map(file => (
            <button
              key={file}
              className={`project-file ${activeFile === file ? "active" : ""}`}
              onClick={() => setActiveFile(file)}
            >
              {file.endsWith("tsx") ? (
                <Code2 size={13} />
              ) : file.endsWith("ts") ? (
                <Server size={13} />
              ) : (
                <FileText size={13} />
              )}
              {file}
              {file.includes("users") && (
                <span className="file-bug">
                  <Bug size={10} />
                </span>
              )}
            </button>
          ))}
          <div className="project-fix-card">
            <div className="project-fix-ring">{fixed}</div>
            <div>
              <strong>Bug fixes</strong>
              <span>of 12 seeded issues</span>
            </div>
          </div>
        </aside>
        <main className="project-editor">
          <div className="tabbar">
            <button className="editor-tab active">
              <FileCode2 size={13} color="#62a9ff" />
              {activeFile}
              <X className="tab-close" size={12} />
            </button>
          </div>
          <div className="breadcrumbs">
            <span>project</span>
            <ChevronRight size={11} />
            <strong>{activeFile}</strong>
            <span style={{ marginLeft: "auto" }}>
              TypeScript · React + Node
            </span>
          </div>
          <div className="project-code">
            <div className="gutter">
              {Array.from({ length: 19 }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre>
              <span className="syntax-comment">
                // Bug 11 · API returns stale user cache
              </span>
              {"\n"}
              <span className="syntax-key">export async function</span>{" "}
              <span className="syntax-fn">getUsers</span>() {"{"}
              {"\n  "}
              <span className="syntax-key">const</span> response ={" "}
              <span className="syntax-key">await</span> fetch(
              <span className="syntax-string">"/api/users"</span>);{"\n  "}
              <span className="syntax-key">const</span> payload ={" "}
              <span className="syntax-key">await</span> response.json();{"\n  "}
              <span className="syntax-comment">
                // TODO: normalize the paginated response
              </span>
              {"\n  "}
              <span className="syntax-key">return</span> payload.users;{"\n"}
              {"}"}
            </pre>
          </div>
          <div className="project-status">
            <span>
              <CheckCircle2 size={12} color="#55d6b0" />
              No compile errors
            </span>
            <span>Tests: {fixed} / 12 passing</span>
            <span style={{ marginLeft: "auto" }}>Protected session</span>
          </div>
          <div className="project-actions">
            <button
              className="toolbar-btn"
              onClick={() => {
                setFixed(Math.min(12, fixed + 1));
              }}
            >
              <Play size={13} />
              Run project tests
            </button>
            <button className="toolbar-btn primary" onClick={onSubmit}>
              <Flag size={13} />
              Submit project
            </button>
          </div>
        </main>
        <aside className="project-assistant">
          <div className="assistant-head">
            <div className="assistant-icon">
              <Sparkles size={14} />
            </div>
            <div>
              <div className="assistant-title">Project Assistant</div>
              <div className="assistant-sub">
                Guidance only · no code insertion
              </div>
            </div>
          </div>
          <div className="assistant-scroll">
            <div className="assistant-note">
              <strong>{fixed} / 12 bugs fixed.</strong> Ask for hints about the
              failing behavior, test output, or architecture.
            </div>
            {messages.map((message, i) => (
              <div className="message ai" key={i}>
                <div className="msg-avatar ai">
                  <Bot size={12} />
                </div>
                <div className="bubble">{message}</div>
              </div>
            ))}
            <div className="ai-section">Live monitoring</div>
            <div className="signal-row">
              <div className="signal-icon">
                <Camera size={14} />
              </div>
              <div>
                <div className="signal-name">Camera active</div>
                <div className="signal-detail">
                  Face framing signal available
                </div>
              </div>
            </div>
            <div className="signal-row">
              <div className="signal-icon">
                <MonitorUp size={14} />
              </div>
              <div>
                <div className="signal-name">Screen shared</div>
                <div className="signal-detail">Assessment window visible</div>
              </div>
            </div>
            <div className="signal-row">
              <div className="signal-icon">
                <Volume2 size={14} />
              </div>
              <div>
                <div className="signal-name">Voice signal active</div>
                <div className="signal-detail">No audio recording stored</div>
              </div>
            </div>
          </div>
          <div className="assistant-input">
            <div className="input-box">
              <textarea
                placeholder="Ask about the failing behavior…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && chatInput.trim()) {
                    e.preventDefault();
                    setMessages(prev => [
                      ...prev,
                      chatInput.trim(),
                      "Look at the response contract and compare it with the failing test's expected shape.",
                    ]);
                    setChatInput("");
                  }
                }}
              />
              <button className="send-btn">
                <Send size={13} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [stage, setStage] = useState<
    "login" | "assignments" | "preflight" | "assessment"
  >("login");
  const [currentAssessment, setCurrentAssessment] =
    useState<AssessmentDefinition | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<LiveAttempt | null>(
    null
  );
  const assessmentStreams = useRef<Partial<Record<CheckId, MediaStream>>>({});
  const [screen, setScreen] = useState<Screen>("workspace");
  const [activeTab, setActiveTab] = useState<ActivityTab>("files");
  const [activeFile, setActiveFile] = useState("solution.js");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [code, setCode] = useState(starterCode);
  const [commits, setCommits] = useState(initialCommits);
  const [selectedCommit, setSelectedCommit] = useState(initialCommits[0].id);
  const [selectedProblem, setSelectedProblem] = useState(1);
  const [eventCount, setEventCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    tone?: "good" | "warn";
  } | null>(null);
  const [language, setLanguage] = useState("JavaScript");
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const assignmentQuery = trpc.assessment.getMyAssignment.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });
  const startSessionMutation = trpc.assessment.startSession.useMutation();
  const createAttemptMutation = trpc.assessment.createAttempt.useMutation();
  const startPreflightMutation = trpc.assessment.startPreflight.useMutation();
  const completePreflightMutation =
    trpc.assessment.completePreflight.useMutation();
  const completeStageMutation = trpc.assessment.completeStage.useMutation();
  const assignment = assignmentQuery.data as
    LiveAssessmentAssignment | undefined;

  const onToast = (text: string, tone?: "good" | "warn") => {
    setToastMessage({ text, tone });
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const createCheckpoint = () => {
    const id = Math.random().toString(16).slice(2, 9);
    setCommits(prev => [
      {
        id,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        message: "checkpoint: solution update",
        problem: "Two Sum",
        additions: 3,
        deletions: 1,
        state: "checkpoint",
      },
      ...prev,
    ]);
    onToast("New checkpoint added to session history", "good");
  };

  useEffect(() => {
    const handler = () => setEventCount(n => n + 1);
    window.addEventListener("blur", handler);
    return () => window.removeEventListener("blur", handler);
  }, []);

  useEffect(() => {
  if (stage !== "assessment" || !currentAttempt?.deadlineAt) {
    setRemainingSeconds(0);
    return;
  }

  const deadline = new Date(
    currentAttempt.deadlineAt as string | Date
  ).getTime();

  if (!Number.isFinite(deadline)) {
    setRemainingSeconds(0);
    return;
  }

  const update = () => {
    const remaining = Math.max(
      0,
      Math.ceil((deadline - Date.now()) / 1000)
    );

    setRemainingSeconds(remaining);
  };

  update();

  const interval = window.setInterval(update, 1000);

  return () => window.clearInterval(interval);
}, [currentAttempt?.deadlineAt, stage]);

useEffect(() => {
  if (
    stage !== "assessment" ||
    !currentAttempt?.deadlineAt
  ) {
    return;
  }

  const deadline = new Date(
    currentAttempt.deadlineAt as string | Date
  ).getTime();

  if (!Number.isFinite(deadline)) return;

  if (Date.now() >= deadline) {
    void finishStage(true);
  }
}, [
  remainingSeconds,
  stage,
  currentAttempt?.deadlineAt,
]);

  useEffect(() => {
    if (isAuthenticated && stage === "login") setStage("assignments");
  }, [isAuthenticated, stage]);

  const stopAssessmentStreams = () => {
    Object.values(assessmentStreams.current).forEach(stream =>
      stream?.getTracks().forEach(track => track.stop())
    );
    assessmentStreams.current = {};
  };

  const beginAssessment = async () => {
    if (!assignment || !user) {
      onToast("No assessment is assigned to this account.", "warn");
      return;
    }
    try {
      await startSessionMutation.mutateAsync({
        assignmentId: assignment.assignmentId,
      });
      const firstSection = [...assignment.sections].sort(
        (a, b) => a.sortOrder - b.sortOrder
      )[0];
      if (!firstSection)
        throw new Error("This assessment has no configured stages.");
      const attempt = await createAttemptMutation.mutateAsync({
        assignmentId: assignment.assignmentId,
        sectionId: firstSection.id,
      });
      setCurrentAssessment(sectionToAssessment(assignment, firstSection));
      setCurrentAttempt({
        id: attempt.id,
        sessionId: attempt.sessionId,
        sectionId: attempt.sectionId,
        status: attempt.status,
        deadlineAt: attempt.deadlineAt,
      });
      await startPreflightMutation.mutateAsync({ attemptId: attempt.id });
      setStage("preflight");
    } catch (error) {
      onToast(
        error instanceof Error
          ? error.message
          : "Could not start the assessment.",
        "warn"
      );
    }
  };

  const completePreflight = async (checks: Record<CheckId, boolean>) => {
    if (!currentAttempt) return;
    try {
      const attempt = await completePreflightMutation.mutateAsync({
        attemptId: currentAttempt.id,
        cameraAvailable: checks.camera,
        microphoneAvailable: checks.voice,
        screenShareAvailable: checks.screen,
        browserFocusAvailable: checks.tabs,
        networkAvailable: checks.internet,
        
      });

      const attemptData = attempt.attempt;
      if (!attemptData) {
        throw new Error("Assessment attempt was not created.");
      }
      setCurrentAttempt({
        id: attemptData.id,
        sessionId: attemptData.sessionId,
        sectionId: attemptData.sectionId,
        status: attemptData.status,
        deadlineAt: attemptData.deadlineAt,
      });
      setStage("assessment");
    } catch (error) {
      onToast(
        error instanceof Error
          ? error.message
          : "Preflight could not be recorded.",
        "warn"
      );
    }
  };

  async function finishStage(fromTimeout = false) {
    if (!currentAttempt || completeStageMutation.isPending) return;
    try {
      const result = await completeStageMutation.mutateAsync({
        attemptId: currentAttempt.id,
        automatic: fromTimeout,
      });
      if (result.finished) {
        stopAssessmentStreams();
        setCurrentAttempt(null);
        setCurrentAssessment(null);
        setStage("assignments");
        await assignmentQuery.refetch();
        onToast(
          fromTimeout
            ? "Assessment completed after the final stage deadline."
            : "Assessment completed successfully.",
          "good"
        );
        return;
      }
      const nextAttempt = result.nextAttempt;
      const nextSection = assignment?.sections.find(
        section => section.id === nextAttempt?.sectionId
      );
      if (!nextAttempt || !nextSection || !assignment)
        throw new Error("The next assessment stage could not be loaded.");
      setCurrentAssessment(sectionToAssessment(assignment, nextSection));
      setCurrentAttempt({
        id: nextAttempt.id,
        sessionId: nextAttempt.sessionId,
        sectionId: nextAttempt.sectionId,
        status: nextAttempt.status,
        deadlineAt: nextAttempt.deadlineAt,
      });
      setScreen("workspace");
      onToast(`${nextSection.title} is now active.`, "good");
    } catch (error) {
      onToast(
        error instanceof Error
          ? error.message
          : "Could not complete this stage.",
        "warn"
      );
    }
  }

  const chooseProblem = (problem: number) => {
    setSelectedProblem(problem);
    setCode(problemTemplates[problem] ?? "");
    setActiveFile("solution.js");
  };

  if (loading)
    return (
      <div className="auth-shell">
        <BrandHeader theme={theme} toggleTheme={toggleTheme} />
        <div className="auth-loading">
          <Loader2 size={20} className="animate-spin" />
          <span>Checking secure session…</span>
        </div>
      </div>
    );
  if (!isAuthenticated)
    return <LoginView theme={theme} toggleTheme={toggleTheme} />;

  if (user?.role === "admin") return <AdminPortal />;

  return <CandidatePortal />;
}
