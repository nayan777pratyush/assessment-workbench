import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  FileCode2,
  FileText,
  Gauge,
  Info,
  ListChecks,
  LogOut,
  MonitorUp,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Timer,
  UserCheck,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  aptitudeQuestions,
  codingProblems,
  bugHuntPacks,
} from "../../../shared/assessmentContent";
import "../candidate-assessment.css";
import { 
  DSA_LANGUAGES, 
  FULL_STACKS,
  type DsaLanguage,
  type FullStackId,
 } from "../../../shared/languages";

type Section = {
  id: number;
  title: string;
  type: "aptitude" | "coding" | "project";
  durationMinutes: number;
  questionCount: number | null;
  sortOrder: number;
  points: number;
};
type Assignment = {
  assignmentId: number;
  assessmentId: number;
  title: string;
  description: string | null;
  assignmentStatus: string;
  sessionStatus: string;
  availableFrom: string | null;
  dueAt: string | null;
  completedAt: string | null;
  sections: Section[];
  score: number;
  maxScore: number;
  results: Array<{ sectionId: number | null; score: number; maxScore: number }>;
};
type Attempt = {
  id: number;
  sectionId: number | null;
  status: string;
  deadlineAt: string | null;
  responseData?: Record<string, any>;
};
type CheckId = "camera" | "microphone" | "screen" | "focus" | "network";

const languageList = DSA_LANGUAGES;

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
function fmtClock(sec: number) {
  const s = Math.max(0, sec);
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function stageIcon(type: Section["type"]) {
  return type === "aptitude"
    ? ListChecks
    : type === "coding"
      ? Code2
      : ShieldCheck;
}
function pointsForSection(s: Section) {
  return s.type === "aptitude" ? 30 : s.type === "coding" ? 300 : 200;
}

export default function CandidatePortal() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"pending" | "completed" | "expired">(
    "pending"
  );
  const [mode, setMode] = useState<"list" | "preflight" | "stage">("list");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const assessmentStreams = useRef<
    Partial<Record<CheckId, MediaStream>>
  >({});
  const [toast, setToast] = useState<string>("");
  const query = trpc.assessment.getMyAssignments.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const content = trpc.assessment.getContent.useQuery(undefined, {
    enabled: mode !== "list",
    refetchOnWindowFocus: false,
  });
  const startSession = trpc.assessment.startSession.useMutation();
  const createAttempt = trpc.assessment.createAttempt.useMutation();
  const startPreflight = trpc.assessment.startPreflight.useMutation();
  const completePreflight = trpc.assessment.completePreflight.useMutation();
  const saveResponse = trpc.assessment.saveResponse.useMutation();
  const runCode = trpc.assessment.runCode.useMutation();
  const completeStage = trpc.assessment.completeStage.useMutation();
  const runBug = trpc.assessment.runBugHunt.useMutation();
  const chat = trpc.assessment.chat.useMutation();
  const recordEvidence = trpc.assessment.recordEvidence.useMutation();
  const current = assignment?.sections[stageIndex];
  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 3200);
  };

useEffect(() => {
  if (mode !== "stage" || !attempt?.deadlineAt) {
    setRemaining(null);
    return;
  }

  const deadline = new Date(attempt.deadlineAt).getTime();

  if (!Number.isFinite(deadline)) {
    setRemaining(null);
    return;
  }

  const tick = () => {
    setRemaining(
      Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    );
  };

  tick();

  const id = window.setInterval(tick, 1000);

  return () => window.clearInterval(id);
}, [attempt?.deadlineAt, mode]);

useEffect(() => {
  if (
    mode !== "stage" ||
    !attempt?.deadlineAt ||
    completeStage.isPending
  ) {
    return;
  }

  const deadline = new Date(attempt.deadlineAt).getTime();

  if (!Number.isFinite(deadline)) return;

  if (Date.now() >= deadline) {
    void moveNext(true);
  }
}, [
  remaining,
  mode,
  attempt?.deadlineAt,
  attempt?.id,
  completeStage.isPending,
]);

  useEffect(() => {
    if (mode !== "stage" || !attempt) return;
    const send = (
      category: any,
      eventType: string,
      severity: any,
      metadata?: any
    ) => {
      void recordEvidence
        .mutateAsync({
          attemptId: attempt.id,
          category,
          eventType,
          severity,
          metadata,
        })
        .catch(() => {});
    };
    const vis = () => {
      if (document.visibilityState !== "visible")
        send("browser", "visibility_hidden", "medium");
    };
    const blur = () => send("browser", "window_blur", "low");
    const copy = () => send("interaction", "clipboard_copy", "info");
    const paste = () => send("interaction", "clipboard_paste", "medium");
    const fullscreen = () => send("browser", "fullscreen_exit", "medium");
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("blur", blur);
    document.addEventListener("copy", copy);
    document.addEventListener("paste", paste);
    document.addEventListener("fullscreenchange", fullscreen);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("blur", blur);
      document.removeEventListener("copy", copy);
      document.removeEventListener("paste", paste);
      document.removeEventListener("fullscreenchange", fullscreen);
    };
  }, [mode, attempt?.id]);

useEffect(() => {
  if (mode !== "stage" || !attempt) return;

  const streams = assessmentStreams.current;

  const handlers: Array<{
    stream: MediaStream;
    track: MediaStreamTrack;
    handler: () => void;
  }> = [];

  for (const [kind, stream] of Object.entries(streams)) {
    if (!stream) continue;

    for (const track of stream.getTracks()) {
      const handler = () => {
        void recordEvidence
          .mutateAsync({
            attemptId: attempt.id,
            category:
              kind === "screen"
                ? "screen"
                : kind === "microphone"
                  ? "audio"
                  : "camera",
            eventType: "media_track_ended",
            severity: "high",
            metadata: {
              kind,
              trackKind: track.kind,
            },
          })
          .catch(() => {});
      };

      track.addEventListener("ended", handler);

      handlers.push({
        stream,
        track,
        handler,
      });
    }
  }

  return () => {
    handlers.forEach(({ track, handler }) => {
      track.removeEventListener("ended", handler);
    });
  };
}, [mode, attempt?.id]);

  async function open(a: Assignment) {
    setAssignment(a);
    try {
      if (
        a.sessionStatus === "completed" ||
        a.assignmentStatus === "completed"
      ) {
        notify("Assessment already completed.");
        return;
      }
      if (a.availableFrom && Date.now() < new Date(a.availableFrom).getTime()) {
        notify(`Assessment opens ${fmtDate(a.availableFrom)}.`);
        return;
      }
      if (a.dueAt && Date.now() > new Date(a.dueAt).getTime()) {
        notify("Assessment window has expired.");
        await query.refetch();
        return;
      }
      await startSession.mutateAsync({ assignmentId: a.assignmentId });
      const first = a.sections[0];
      if (!first) throw new Error("No assessment section is configured.");
      const at = await createAttempt.mutateAsync({
        assignmentId: a.assignmentId,
      });
      const section = a.sections.find(s => s.id === at.sectionId) ?? first;
      setAttempt(at as Attempt);
      setStageIndex(
        Math.max(
          0,
          a.sections.findIndex(s => s.id === section.id)
        )
      );
      if ((at as Attempt).status === "in_progress") {
        setMode("stage");
        notify("Resuming your active assessment.");
      } else {
        await startPreflight.mutateAsync({ attemptId: (at as Attempt).id });
        setMode("preflight");
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : "Unable to open assessment.");
    }
  }

  async function finishPreflight(checks: Record<CheckId, boolean>) {
    if (!attempt) return;
    try {
      const r = await completePreflight.mutateAsync({
        attemptId: attempt.id,
        cameraAvailable: checks.camera,
        microphoneAvailable: checks.microphone,
        screenShareAvailable: checks.screen,
        browserFocusAvailable: checks.focus,
        networkAvailable: checks.network,
      });
      if (!r.check.passed)
        throw new Error("Every required environment check must pass.");
      setAttempt(r.attempt as Attempt);
      setMode("stage");
      notify("Environment verified. Your section timer has started.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Environment check failed.");
    }
  }

  function stopAssessmentStreams() {
    Object.values(assessmentStreams.current).forEach(stream => {
      stream?.getTracks().forEach(track => track.stop());
    });
    assessmentStreams.current = {};
  }

  async function moveNext(timeout = false) {
    if (!attempt) return;
    try {
      const r = await completeStage.mutateAsync({
        attemptId: attempt.id,
        automatic: timeout,
      });
      if (r.finished) {
        stopAssessmentStreams();
        setMode("list");
        setAssignment(null);
        setAttempt(null);
        await query.refetch();
        notify(
          timeout
            ? "Time expired. Assessment submitted and completed."
            : "Assessment completed successfully."
        );
        return;
      }
      const next = r.nextAttempt as Attempt;
      const idx =
        assignment?.sections.findIndex(s => s.id === next.sectionId) ?? -1;
      if (!assignment || idx < 0)
        throw new Error("Next section could not be loaded.");
      setAttempt(next);
      setStageIndex(idx);
      notify(
        timeout
          ? "Time expired. Moving to the next section."
          : "Section submitted. The next section is now locked in."
      );
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not advance section.");
    }
  }

  function logoutNow() {
    void logout();
    setMode("list");
    setAssignment(null);
    setAttempt(null);
  }

  if (mode === "preflight" && assignment && attempt)
    return (
      <Preflight
        assignment={assignment}
        streams={assessmentStreams}
        onBack={() => setMode("list")}
        onStart={finishPreflight}
        theme={theme}
        toggleTheme={toggleTheme ?? (() => {})}
      />
    );
  if (mode === "stage" && assignment && attempt && current)
    return (
      <AssessmentStage
        assignment={assignment}
        section={current}
        attempt={attempt}
        remaining={remaining ?? 0}
        content={content.data}
        onSave={p =>
          saveResponse.mutateAsync({ attemptId: attempt.id, patch: p })
        }
        onRunCode={(p, l, c, publicOnly) =>
          runCode.mutateAsync({
            attemptId: attempt.id,
            problemId: p,
            language: l,
            code: c,
            publicOnly,
          })
        }
        onRunBug={(stackId, files) =>
          runBug.mutateAsync({ 
            attemptId: attempt.id, 
            stackId, 
            files, 
          })
        }
        onChat={m => chat.mutateAsync({ attemptId: attempt.id, message: m })}
        onNext={() => void moveNext(false)}
        onBack={() => notify("You cannot go back after a section has started.")}
        notify={notify}
      />
    );
  const data = (query.data ?? []) as Assignment[];
  const list = data.filter(
    a =>
      a.assignmentStatus === tab ||
      (tab === "pending" &&
        ["assigned", "started"].includes(a.assignmentStatus))
  );
  return (
    <div className="candidate-page" data-theme={theme}>
      <CandidateHeader
        theme={theme}
        toggleTheme={toggleTheme ?? (() => {})}
        user={user}
        onLogout={logoutNow}
      />
      <main className="candidate-main">
        <div className="candidate-title-row">
          <div>
            <div className="cs-eyebrow">ASSESSMENTS</div>
            <h1>Assessments</h1>
            <p>Complete assigned assessments in their scheduled window.</p>
          </div>
          <div className="candidate-user">
            <UserCheck size={15} />
            {user?.name || user?.email}
          </div>
        </div>
        <div className="cs-tabs">
          {(["pending", "completed", "expired"] as const).map(t => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}{" "}
              <b>{data.filter(a => a.assignmentStatus === t).length}</b>
            </button>
          ))}
        </div>
        <div className="assessment-table-head">
          <span>Assessment</span>
          <span>Scheduled</span>
          <span>Duration</span>
          <span>Points</span>
          <span>Status</span>
          <span></span>
        </div>
        {list.length === 0 ? (
          <div className="empty-state">
            <ClipboardIcon />
            <h2>No {tab} assessments</h2>
            <p>Assigned assessments will appear here.</p>
          </div>
        ) : (
          list.map(a => (
            <AssessmentRow key={a.assignmentId} a={a} onOpen={() => open(a)} />
          ))
        )}
      </main>
      {toast && (
        <div className="cs-toast">
          <CheckCircle2 size={15} />
          {toast}
        </div>
      )}
    </div>
  );
}

function CandidateHeader({
  theme,
  toggleTheme,
  user,
  onLogout,
}: {
  theme: string;
  toggleTheme: () => void;
  user: any;
  onLogout: () => void;
}) {
  return (
    <header className="candidate-header">
      <div className="cs-brand">
        <span>A</span>
        <div>
          <strong>ASSESSMENT WORKBENCH</strong>
          <small>evidence-first assessments</small>
        </div>
      </div>
      <div className="cs-header-actions">
        <button onClick={toggleTheme}>{theme === "dark" ? "☀" : "☾"}</button>
        <button onClick={onLogout}>
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </header>
  );
}

function AssessmentRow({ a, onOpen }: { a: Assignment; onOpen: () => void }) {
  const total = a.sections.reduce((n, s) => n + s.durationMinutes, 0);
  const scheduled = a.availableFrom
    ? fmtDate(a.availableFrom)
    : "Available now";
  const completed = a.assignmentStatus === "completed";
  return (
    <div className="assessment-row">
      <div>
        <strong>{a.title}</strong>
        <small>{a.description || "Proctored assessment"}</small>
      </div>
      <div>
        {scheduled}
        <small>
          {a.dueAt ? `Until ${fmtDate(a.dueAt)}` : "No closing time"}
        </small>
      </div>
      <div>
        {Math.floor(total / 60)}h {total % 60 ? `${total % 60}m` : ""}
      </div>
      <div>
        <b>{a.maxScore} pts</b>
        {completed && (
          <small className="score-breakdown">
            {a.sections
              .map(s => {
                const r = a.results.find(x => x.sectionId === s.id);
                return `${s.type === "aptitude" ? "Apt" : s.type === "coding" ? "DSA" : "Bug"} ${r?.score ?? 0}/${s.points}`;
              })
              .join(" · ")}
          </small>
        )}
      </div>
      <div>
        <span
          className={`cs-status ${completed ? "done" : a.assignmentStatus === "expired" ? "expired" : "pending"}`}
        >
          {completed
            ? "Completed"
            : a.assignmentStatus === "expired"
              ? "Expired"
              : "Pending"}
        </span>
        {completed && (
          <small>
            {a.score}/{a.maxScore}
          </small>
        )}
      </div>
      <div>
        <button
          className="open-assessment"
          disabled={completed || a.assignmentStatus === "expired"}
          onClick={onOpen}
        >
          {completed ? "Test done" : "Open assessment"}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function ClipboardIcon() {
  return (
    <div className="empty-icon">
      <ListChecks size={25} />
    </div>
  );
}

function Preflight({
  assignment,
  streams,
  onBack,
  onStart,
  theme,
  toggleTheme,
}: {
  assignment: Assignment;
  streams: React.MutableRefObject<
    Partial<Record<CheckId, MediaStream>>
  >;
  onBack: () => void;
  onStart: (c: Record<CheckId, boolean>) => void;
  theme: string;
  toggleTheme: () => void;
}) {
  const [checks, setChecks] = useState<Record<CheckId, boolean>>({
    camera: false,
    microphone: false,
    screen: false,
    focus: false,
    network: false,
  });
  const [busy, setBusy] = useState<CheckId | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  
  const rows: [CheckId, string, string, any][] = [
    [
      "camera",
      "Camera & face visibility",
      "Camera permission and a live preview are required.",
      Camera,
    ],
    [
      "microphone",
      "Microphone / audio",
      "Microphone permission is required for speech-activity signals.",
      Terminal,
    ],
    [
      "screen",
      "Screen share",
      "Share this browser window or full screen.",
      MonitorUp,
    ],
    [
      "focus",
      "Browser focus",
      "Assessment tab must remain visible; focus changes are logged.",
      ShieldCheck,
    ],
    [
      "network",
      "Network quality",
      "Connectivity and latency check to the assessment server.",
      Gauge,
    ],
  ];
  async function run(id: CheckId) {
    setBusy(id);
    try {
      if (id === "camera" || id === "microphone") {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: id === "camera",
          audio: id === "microphone",
        });
        streams.current[id] = stream;
        if (id === "camera" && video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => {});
        }
      } else if (id === "screen") {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        streams.current.screen = stream;
        stream
          .getVideoTracks()[0]
          .addEventListener("ended", () =>
            setChecks(x => ({ ...x, screen: false }))
          );
      } else if (id === "focus") {
        if (document.visibilityState !== "visible")
          throw new Error("Keep the assessment tab visible.");
      } else {
        if (!navigator.onLine) throw new Error("You are offline.");
        const t = performance.now();
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        if (!r.ok) throw new Error("Network request failed.");
        const ms = Math.round(performance.now() - t);
        if (ms > 3000) throw new Error("Network latency is too high.");
      }
      setChecks(x => ({ ...x, [id]: true }));
    } catch (e) {
      setChecks(x => ({ ...x, [id]: false }));
    } finally {
      setBusy(null);
    }
  }
  useEffect(() => {
    const h = () => {
      if (document.visibilityState !== "visible")
        setChecks(x => ({ ...x, focus: false }));
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, []);
  
  const all = Object.values(checks).every(Boolean);
  return (
    <div className="candidate-page" data-theme={theme}>
      <CandidateHeader
        theme={theme}
        toggleTheme={toggleTheme}
        user={null}
        onLogout={onBack}
      />
      <main className="preflight-page">
        <button className="plain-back" onClick={onBack}>
          <ArrowLeft size={15} /> Back to assessments
        </button>
        <div className="verification-banner">
          <ShieldCheck />
          <div>
            <strong>Verification before test start</strong>
            <p>
              Opening the assessment does not start the timer. The test begins
              only after every environment check passes and you confirm{" "}
              <b>Start test</b>.
            </p>
          </div>
        </div>
        <div className="preflight-grid">
          <section className="preflight-panel">
            <div className="panel-title">
              <div>
                <span>SECURE TEST ENVIRONMENT</span>
                <h1>System check</h1>
              </div>
              <span className={`ready-pill ${all ? "ready" : ""}`}>
                {Object.values(checks).filter(Boolean).length}/5 passed
              </span>
            </div>
            {rows.map(([id, label, detail, Icon]) => (
              <div
                className={`check-item ${checks[id] ? "passed" : ""}`}
                key={id}
              >
                <Icon size={19} />
                <div>
                  <strong>{label}</strong>
                  <p>{detail}</p>
                </div>
                {checks[id] ? (
                  <CheckCircle2 className="ok" />
                ) : (
                  <button onClick={() => run(id)} disabled={busy !== null}>
                    {busy === id ? "Checking…" : "Run check"}
                  </button>
                )}
              </div>
            ))}
            <div className="preflight-footer">
              <button
                className="plain-btn"
                onClick={() =>
                  setChecks({
                    camera: false,
                    microphone: false,
                    screen: false,
                    focus: false,
                    network: false,
                  })
                }
              >
                Reset
              </button>
              <button
                className="start-test"
                disabled={!all}
                onClick={() => onStart(checks)}
              >
                Start test <ArrowRight size={16} />
              </button>
            </div>
          </section>
          <aside className="camera-panel">
            <div className="panel-title">
              <span>LIVE PREVIEW</span>
              <span className="live-dot">● LIVE</span>
            </div>
            <div className="camera-box">
              {checks.camera ? (
                <video ref={video} muted playsInline />
              ) : (
                <UserCheck size={58} />
              )}
            </div>
            <p>
              Face visibility is checked as evidence, not as a standalone
              cheating verdict. Additional signals are combined by the
              evaluator.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

function AssessmentStage({
  assignment,
  section,
  attempt,
  remaining,
  content,
  onSave,
  onRunCode,
  onRunBug,
  onChat,
  onNext,
  onBack,
  notify,
}: {
  assignment: Assignment;
  section: Section;
  attempt: Attempt;
  remaining: number;
  content: any;
  onSave: (p: any) => Promise<any>;
  onRunCode: (
    p: string,
    l: any,
    c: string,
    publicOnly: boolean
  ) => Promise<any>;
  onRunBug: (l: any, f: Record<string, string>) => Promise<any>;
  onChat: (m: string) => Promise<any>;
  onNext: () => void;
  onBack: () => void;
  notify: (m: string) => void;
}) {
  const warning = remaining <= 300;
  const Icon = stageIcon(section.type);
  return (
    <div className="assessment-stage" data-warning={warning}>
      <header className="stage-header">
        <div className="stage-brand">
          <span>A</span>
          <div>
            <b>ASSESSMENT WORKBENCH</b>
            <small>{assignment.title}</small>
          </div>
        </div>
        <div className="stage-progress">
          Stage {section.sortOrder} of {assignment.sections.length} ·{" "}
          {section.title}
        </div>
        <div className="stage-clock">
          <Clock3 size={15} />
          {fmtClock(remaining)}
        </div>
        <button
          className="finish-btn"
          onClick={() => {
            const final = section.sortOrder === assignment.sections.length;
            const text = final
              ? "Finish the assessment? Your Bug Hunt work will be submitted and you cannot return."
              : "Submit this section and move permanently to the next section? You cannot return.";
            if (confirm(text)) onNext();
          }}
        >
          {section.sortOrder === assignment.sections.length
            ? "Finish assessment"
            : "Move to next section"}{" "}
          <ArrowRight size={15} />
        </button>
      </header>
      <div className="stage-body">
        <div className="proctor-strip">
          <span>
            <Camera size={13} /> Camera
          </span>
          <span>
            <Terminal size={13} /> Audio
          </span>
          <span>
            <MonitorUp size={13} /> Screen
          </span>
          <span>
            <ShieldCheck size={13} /> Focus
          </span>
          <span className="right-note">Server deadline enforced</span>
        </div>
        {section.type === "aptitude" ? (
          <Aptitude
            section={section}
            attempt={attempt}
            onSave={onSave}
            onNext={onNext}
          />
        ) : section.type === "coding" ? (
          <DSA
            section={section}
            attempt={attempt}
            content={content}
            onSave={onSave}
            onRunCode={onRunCode}
            notify={notify}
          />
        ) : (
          <BugHunt
            section={section}
            attempt={attempt}
            content={content}
            onSave={onSave}
            onRunBug={onRunBug}
            onChat={onChat}
            notify={notify}
          />
        )}
      </div>
    </div>
  );
}

function Aptitude({
  section,
  attempt,
  onSave,
  onNext,
}: {
  section: Section;
  attempt: Attempt;
  onSave: (p: any) => Promise<any>;
  onNext: () => void;
}) {
  const answers = attempt.responseData?.answers ?? {};
  const [q, setQ] = useState(0);
  const [local, setLocal] = useState<Record<string, number>>(answers);
  const save = async (i: number) => {
    setLocal(x => ({
      ...x,
      [aptitudeQuestions[i].id]: local[aptitudeQuestions[i].id] ?? -1,
    }));
    await onSave({ answers: local });
  };
  return (
    <div className="aptitude-layout">
      <aside className="question-nav">
        <div className="qn-head">
          <b>Quantitative Aptitude</b>
          <span>30 QUESTIONS</span>
        </div>
        <div className="qn-grid">
          {aptitudeQuestions.map((x, i) => (
            <button
              key={x.id}
              className={`${i === q ? "current " : ""}${local[x.id] !== undefined ? "answered" : ""}`}
              onClick={() => setQ(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="qn-legend">
          <span>Answered {Object.keys(local).length}/30</span>
          <span>1 point each</span>
        </div>
      </aside>
      <main className="aptitude-card">
        <div className="problem-kicker">QUESTION {q + 1} / 30</div>
        <h1>{aptitudeQuestions[q].question}</h1>
        <div className="mcq-list">
          {aptitudeQuestions[q].options.map((o, i) => (
            <button
              key={o}
              className={local[aptitudeQuestions[q].id] === i ? "selected" : ""}
              onClick={async () => {
                const next = { ...local, [aptitudeQuestions[q].id]: i };
                setLocal(next);
                await onSave({ answers: next });
              }}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {o}
              {local[aptitudeQuestions[q].id] === i && <Check size={16} />}
            </button>
          ))}
        </div>
        <div className="aptitude-nav">
          <button disabled={q === 0} onClick={() => setQ(q - 1)}>
            <ArrowLeft size={15} /> Previous
          </button>
          <span>
            {q < 29
              ? "You can review answered questions before submitting."
              : "Last question"}
          </span>
          {q < 29 ? (
            <button onClick={() => setQ(q + 1)}>
              Next <ArrowRight size={15} />
            </button>
          ) : (
            <button className="section-submit" onClick={() => onNext()}>
              Move to next section <Send size={15} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function DSA({
  section,
  attempt,
  content,
  onSave,
  onRunCode,
  notify,
}: {
  section: Section;
  attempt: Attempt;
  content: any;
  onSave: (p: any) => Promise<any>;
  onRunCode: (
    p: string,
    l: any,
    c: string,
    publicOnly: boolean
  ) => Promise<any>;
  notify: (m: string) => void;
}) {
  const problems = content?.coding ?? codingProblems;
  const submissions = attempt.responseData?.codingSubmissions ?? {};
  const [pi, setPi] = useState(0);
  const [language, setLanguage] = useState<DsaLanguage>("JavaScript");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const p = problems[pi];
  const starter = trpc.assessment.getStarterCode.useQuery(
    { problemId: p.id, language},
    { staleTime: Infinity }
  );
  useEffect(() => {
    const saved =
      submissions[p.id]?.language === language ? submissions[p.id]?.code : null;
    setCode(saved ?? starter.data?.code ?? "");
    setResult(null);
  }, [p.id, language, starter.data?.code]);
  async function run(publicOnly: boolean) {
    try {
      const r = await onRunCode(p.id, language, code, publicOnly);
      setResult({ ...r, publicOnly });
      if (!publicOnly)
        notify(
          r.passed === r.total
            ? "All test cases passed successfully."
            : `Submission failed: ${r.errorType ?? "wrong answer"}.`
        );
    } catch (e) {
      notify(e instanceof Error ? e.message : "Code execution failed.");
    }
  }
  return (
    <div className="coding-layout">
      <aside className="problem-list">
        <div className="problem-list-head">
          <b>Problem List</b>
          <span>3</span>
        </div>
        {problems.slice(0, 3).map((x: any, i: number) => (
          <button
            key={x.id}
            className={i === pi ? "active" : ""}
            onClick={() => setPi(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <b>{x.title}</b>
              <small>{x.difficulty} · 100 pts</small>
            </div>
          </button>
        ))}
      </aside>
      <section className="problem-pane">
        <div className="pane-tabs">
          <span className="active">Description</span>
          <span>Submissions</span>
        </div>
        <div className="problem-scroll">
          <div className="problem-number">Problem {p.number}</div>
          <h1>{p.title}</h1>
          <span className={`difficulty ${p.difficulty.toLowerCase()}`}>
            {p.difficulty}
          </span>
          <p>{p.description}</p>
          <h3>Examples</h3>
          {p.examples.slice(0, 3).map((e: any, i: number) => (
            <div className="example-box" key={i}>
              <b>Example {i + 1}</b>
              <code>Input: {e.input}</code>
              <code>Output: {e.output}</code>
              {e.explanation && <p>Explanation: {e.explanation}</p>}
            </div>
          ))}
          <h3>Constraints</h3>
          <ul>
            {p.constraints.map((c: string) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="editor-pane">
        <div className="editor-toolbar">
          <select value={language} onChange={e => setLanguage(e.target.value as DsaLanguage)}>
            {languageList.map(x => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <span>
            <FileCode2 size={14} /> 
            Implement only the provided function
          </span>
          <button onClick={() => run(true)}>
            <Play size={14} /> Run sample test
          </button>
          <button className="run-all" onClick={() => run(false)}>
            <Play size={14} /> Run all tests
          </button>
        </div>
        <textarea
          spellCheck={false}
          value={code}
          onChange={e => {
            setCode(e.target.value);
            void onSave({
              codingSubmissions: {
                ...submissions,
                [p.id]: {
                  ...(submissions[p.id] ?? {}),
                  language,
                  code: e.target.value,
                },
              },
            });
          }}
        />
        <div className={`test-console ${result ? "show" : ""}`}>
          <div className="console-head">
            <span>Test Result</span>
            {result && (
              <strong
                className={result.passed === result.total ? "pass" : "fail"}
              >
                {result.passed}/{result.total} passed
              </strong>
            )}
          </div>
          <pre>
            {result
              ? result.output
              : "Run the example test case first. Submit / Run all executes the full test suite."}
          </pre>
          {result?.errorType && (
            <div className="error-type">{result.errorType}</div>
          )}
        </div>
      </section>
    </div>
  );
}

function BugHunt({
  section,
  attempt,
  content,
  onSave,
  onRunBug,
  onChat,
  notify,
}: {
  section: Section;
  attempt: Attempt;
  content: any;
  onSave: (p: any) => Promise<any>;
  onRunBug: (l: any, f: Record<string, string>) => Promise<any>;
  onChat: (m: string) => Promise<any>;
  notify: (m: string) => void;
}) {
  const packs = content?.bugHunt ?? bugHuntPacks;
  const [stack, setStack] = useState<FullStackId>(FULL_STACKS[0].id);
  const selectedStack = FULL_STACKS.find(
    x => x.id === stack
  )!;
  const [files, setFiles] = useState<Record<string, string>>(
    packs[stack]?.files ?? {}
  );
  const [active, setActive] = useState(
    Object.keys(packs[stack]?.files ?? {})[0]
  );
  const [result, setResult] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([
    {
      role: "ai",
      text: "Bug Hunt support is enabled. I can help you reason about the failing behavior, contracts, edge cases, and architecture. I will not insert the fix for you.",
    },
  ]);
  
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const f = packs[stack]?.files ?? {};
    setFiles(f);
    setActive(Object.keys(f)[0]);
    setResult(null);
  }, [stack]);

  const firstFile =
    Object.keys(files).find(f => f === "README.md") ??
    Object.keys(files)[0];

  async function run() {
    try {
      const r = await onRunBug(stack, files);
      setResult(r);
      notify(
        r.passed === r.total
          ? "Bug Hunt test suite passed."
          : `${r.passed}/${r.total} checks passed.`
      );
    } catch (e) {
      notify(e instanceof Error ? e.message : "Bug Hunt execution failed.");
    }
  }
  async function ask() {
    if (!msg.trim()) return;
    const m = msg.trim();
    setMessages(x => [...x, { role: "user", text: m }]);
    setMsg("");
    try {
      const r = await onChat(m);
      setMessages(x => [...x, { role: "ai", text: r.response }]);
    } catch (e) {
      notify(e instanceof Error ? e.message : "AI support failed.");
    }
  }
  return (
    <div className="bug-layout">
      <aside className="bug-files">
        <div className="bug-kicker">BUG HUNT</div>
<select
  value={stack}
  onChange={e => setStack(e.target.value as FullStackId)}
>
  {FULL_STACKS.map(x => (
    <option key={x.id} value={x.id}>
      {x.name}
    </option>
  ))}
</select>
        <div className="file-tree">
          {Object.keys(files).map(f => (
            <button
              key={f}
              className={active === f ? "active" : ""}
              onClick={() => setActive(f)}
            >
              {f.endsWith("README.md") ? (
                <FileText size={14} />
              ) : (
                <FileCode2 size={14} />
              )}{" "}
              {f}
            </button>
          ))}
        </div>
        <div className="bug-readme">
          <b>README is mandatory</b>
          <p>{packs[stack]?.description}</p>
        </div>
      </aside>
      <section className="bug-editor">
        <div className="bug-editor-head">
          <span>{active}</span>
          <span>Editable project file</span>
        </div>
        <textarea
          spellCheck={false}
          value={files[active] ?? ""}
          onChange={e => {
            const next = { ...files, [active]: e.target.value };
            setFiles(next);
            void onSave({ bugHunt: { language: stack, files: next } });
          }}
        />
        <div className="bug-terminal">
          <div>
            <b>Test suite</b>
            <button onClick={run}>
              <Play size={13} /> Run tests
            </button>
          </div>
          <pre>
            {result
              ? result.output
              : "Run the suite after fixing the seeded bugs. Tests never auto-advance the assessment."}
          </pre>
        </div>
      </section>
      <aside className="ai-panel">
        <div className="ai-head">
          <Sparkles size={16} />
          <div>
            <b>AI support</b>
            <small>Bug Hunt only · guidance, not code insertion</small>
          </div>
        </div>
        <div className="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={m.role}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="ai-compose">
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Ask about the failing behavior…"
          />
          <button onClick={ask}>
            <Send size={15} />
          </button>
        </div>
      </aside>
    </div>
  );
}

