import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Plus,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import "../candidate-assessment.css";

const TYPES = [
  {
    type: "aptitude",
    label: "Quantitative Aptitude",
    duration: 60,
    points: 30,
  },
  { type: "coding", label: "DSA Coding", duration: 120, points: 300 },
  { type: "project", label: "Full-stack Bug Hunt", duration: 120, points: 200 },
] as const;
export default function AdminPortal() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [title, setTitle] = useState("Technical Assessment");
  const [description, setDescription] = useState(
    "Proctored technical assessment"
  );
  const [email, setEmail] = useState("");
  const [from, setFrom] = useState("");
  const [due, setDue] = useState("");
  const [message, setMessage] = useState("");
  const create = trpc.assessment.adminCreate.useMutation();
  const list = trpc.assessment.adminList.useQuery();

  async function submit() {
    try {
      if (!email.trim()) throw new Error("Candidate Gmail is required.");
      const sections = TYPES.map((x, i) => ({
        type: x.type,
        sortOrder: i + 1,
      }));
      await create.mutateAsync({
        title,
        description,
        candidateEmail: email.trim().toLowerCase(),
        availableFrom: from ? new Date(from).toISOString() : undefined,
        dueAt: due ? new Date(due).toISOString() : undefined,
        sections,
      });
      setMessage("Assessment assigned successfully.");
      setEmail("");
      await list.refetch();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not create assignment."
      );
    }
  }
  return (
    <div className="candidate-page" data-theme={theme}>
      <header className="candidate-header">
        <div className="cs-brand">
          <span>A</span>
          <div>
            <strong>ASSESSMENT WORKBENCH</strong>
            <small>creator console</small>
          </div>
        </div>
        <div className="cs-header-actions">
          <span className="role-pill">ADMIN / CREATOR</span>
          <button onClick={toggleTheme}>{theme === "dark" ? "☀" : "☾"}</button>
          <button onClick={() => void logout()}>
            <Users size={15} /> Sign out
          </button>
        </div>
      </header>
      <main className="admin-main">
        <div className="candidate-title-row">
          <div>
            <div className="cs-eyebrow">ASSESSMENT CREATOR</div>
            <h1>Create & assign</h1>
            <p>
              Create the complete three-stage assessment, schedule the
              overall sitting window, and assign it directly to a candidate.
            </p>
          </div>
        </div>
        <div className="admin-grid">
          <section className="admin-card">
            <h2>Assessment configuration</h2>
            <label>
              Assessment title
              <input value={title} onChange={e => setTitle(e.target.value)} />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </label>
<div className="section-choice">
  <b>Assessment stages</b>
  <small>
    All three stages are mandatory and must be completed in one sitting.
  </small>

  {TYPES.map((x, index) => (
    <div className="fixed-section" key={x.type}>
      <span>{index + 1}</span>

      <div>
        <strong>{x.label}</strong>
        <small>
          {x.duration} minutes · {x.points} points
        </small>
      </div>

      <CheckCircle2 />
    </div>
  ))}
</div>
<div className="total-bar">
  <b>Total assessment window</b>
  <strong>5h</strong>
  <span>
    Aptitude 60m · DSA 120m · Bug Hunt 120m.
    Each stage has an independent timer.
  </span>
</div>
          </section>
          <section className="admin-card">
            <h2>Candidate & schedule</h2>
            <label>
              Candidate Gmail
              <input
                type="email"
                placeholder="candidate@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>
            <label>
              <span>
                <CalendarDays />
                Available from
              </span>
              <input
                type="datetime-local"
                value={from}
                onChange={e => setFrom(e.target.value)}
              />
            </label>
            <label>
              <span>
                <Clock3 />
                Due / closes at
              </span>
              <input
                type="datetime-local"
                value={due}
                onChange={e => setDue(e.target.value)}
              />
            </label>
            <div className="admin-preview">
              <Mail size={18} />
              <div>
                <b>Candidate will see</b>
                <p>
                  Pending → scheduled date/time → Open assessment → verification
                  → Start test.
                </p>
              </div>
            </div>
            <button
              className="assign-button"
              onClick={submit}
              disabled={create.isPending}
            >
              <Send size={15} />
              {create.isPending ? "Assigning…" : "Assign assessment"}
            </button>
            {message && (
              <div className="admin-message">
                <CheckCircle2 size={15} />
                {message}
              </div>
            )}
          </section>
        </div>
        <section className="admin-card admin-list">
          <div className="list-head">
            <div>
              <h2>Recent assignments</h2>
              <small>Creator view of assignments sent from this console.</small>
            </div>
          </div>
          {(list.data ?? []).map((x: any) => (
            <div className="admin-row" key={x.assignmentId}>
              <div>
                <b>{x.title}</b>
                <small>{x.candidateEmail}</small>
              </div>
              <span>{x.assignmentStatus}</span>
              <small>
                {x.availableFrom
                  ? new Date(x.availableFrom).toLocaleString()
                  : "Available now"}
              </small>
              <strong>{x.maxScore} pts</strong>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
