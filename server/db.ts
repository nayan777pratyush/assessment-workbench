import { and, eq, gt, inArray, isNull, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  assignments,
  assessments,
  assessmentSections,
  assessmentSessions,
  attempts,
  authAccounts,
  evidenceEvents,
  magicLinkTokens,
  preflightChecks,
  type AssessmentAttempt,
  type AssessmentSession,
  type EvidenceEvent,
  type User,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import {
  gradeCodingSubmission,
  gradeBugHuntSubmission,
} from "./assessmentGrading";

let pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getPool() {
  if (!pool) {
    if (!ENV.databaseUrl) throw new Error("DATABASE_URL is not configured");
    pool = new Pool({
      connectionString: ENV.databaseUrl,
      max: ENV.dbPoolMax,
      connectionTimeoutMillis: 10_000,
      ...(ENV.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    });
  }
  return pool;
}

export function getDb() {
  if (!_db) _db = drizzle({ client: getPool() });
  return _db;
}

export async function findOrCreateUserForProvider(input: {
  provider: string;
  providerAccountId: string;
  name: string | null;
  email: string | null;
  emailVerified?: boolean;
}): Promise<User> {
  const db = getDb();
  const normalizedEmail = input.email?.trim().toLowerCase() || null;
  const existingAccount = await db
    .select({ user: users })
    .from(authAccounts)
    .innerJoin(users, eq(authAccounts.userId, users.id))
    .where(
      and(
        eq(authAccounts.provider, input.provider),
        eq(authAccounts.providerAccountId, input.providerAccountId)
      )
    )
    .limit(1);
  let user = existingAccount[0]?.user;
  if (!user && normalizedEmail && input.emailVerified) {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    user = existingUser[0];
  }
  if (!user) {
    const inserted = await db
      .insert(users)
      .values({
        name: input.name,
        email: normalizedEmail,
        lastSignedIn: new Date(),
      })
      .returning();
    user = inserted[0];
  } else {
    const updated = await db
      .update(users)
      .set({
        name: input.name || user.name,
        email: normalizedEmail || user.email,
        lastSignedIn: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    user = updated[0] ?? user;
  }
  const accountExists = await db
    .select({ id: authAccounts.id })
    .from(authAccounts)
    .where(
      and(
        eq(authAccounts.provider, input.provider),
        eq(authAccounts.providerAccountId, input.providerAccountId)
      )
    )
    .limit(1);
  if (!accountExists[0])
    await db
      .insert(authAccounts)
      .values({
        userId: user.id,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
      });
  return user;
}

export async function getUserById(id: number) {
  return (
    await getDb().select().from(users).where(eq(users.id, id)).limit(1)
  )[0];
}

export async function createMagicLinkToken(
  email: string,
  tokenHash: string,
  expiresAt: Date
) {
  await getDb().delete(magicLinkTokens).where(eq(magicLinkTokens.email, email));
  await getDb().insert(magicLinkTokens).values({ email, tokenHash, expiresAt });
}

export async function consumeMagicLinkToken(
  tokenHash: string
): Promise<string | undefined> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        isNull(magicLinkTokens.consumedAt),
        gt(magicLinkTokens.expiresAt, now)
      )
    )
    .limit(1);
  const token = rows[0];
  if (!token) return undefined;
  await db
    .update(magicLinkTokens)
    .set({ consumedAt: now })
    .where(eq(magicLinkTokens.id, token.id));
  return token.email;
}

async function ensureDefaultAssessment(candidateId: number) {
  const db = getDb();
  let assessment = (
    await db
      .select()
      .from(assessments)
      .where(eq(assessments.title, "Assessment Workbench — Full Assessment"))
      .limit(1)
  )[0];
  if (!assessment) {
    assessment = (
      await db
        .insert(assessments)
        .values({
          title: "Assessment Workbench — Full Assessment",
          description:
            "Three-stage proctored assessment completed in one sitting.",
          type: "aptitude",
          durationMinutes: 300,
          status: "published",
          createdBy: candidateId,
        })
        .returning()
    )[0];
    if (!assessment) throw new Error("Failed to create default assessment");
  }
  const sections = await db
    .select()
    .from(assessmentSections)
    .where(eq(assessmentSections.assessmentId, assessment.id))
    .orderBy(assessmentSections.sortOrder);
  const desired = [
    {
      title: "Quantitative Aptitude",
      type: "aptitude" as const,
      sortOrder: 1,
      durationMinutes: 60,
      questionCount: 30,
      points: 30,
    },
    {
      title: "DSA Coding",
      type: "coding" as const,
      sortOrder: 2,
      durationMinutes: 120,
      questionCount: 3,
      points: 300,
    },
    {
      title: "Frontend + Backend Bug Hunt",
      type: "project" as const,
      sortOrder: 3,
      durationMinutes: 120,
      questionCount: 12,
      points: 200,
    },
  ];
  if (sections.length === 0) {
    await db
      .insert(assessmentSections)
      .values(
        desired.map(section => ({ assessmentId: assessment.id, ...section }))
      );
  } else {
    for (let i = 0; i < Math.min(sections.length, desired.length); i += 1) {
      await db
        .update(assessmentSections)
        .set({ ...desired[i], updatedAt: new Date() })
        .where(eq(assessmentSections.id, sections[i].id));
    }
    if (sections.length > desired.length) {
      const extraIds = sections
        .slice(desired.length)
        .map(section => section.id);
      await db
        .delete(assessmentSections)
        .where(inArray(assessmentSections.id, extraIds));
    }
  }
  let assignment = (
    await db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.assessmentId, assessment.id),
          eq(assignments.candidateId, candidateId)
        )
      )
      .limit(1)
  )[0];
  if (!assignment) {
    assignment = (
      await db
        .insert(assignments)
        .values({
          assessmentId: assessment.id,
          candidateId,
          assignedBy: assessment.createdBy,
          status: "assigned",
        })
        .returning()
    )[0];
  }
  if (!assignment) throw new Error("Failed to create candidate assignment");
  return { assessment, assignment };
}

export async function getCandidateAssessmentAssignment(candidateId: number) {
  const rows = await getCandidateAssignments(candidateId);
  return rows[0];
}

export async function getCandidateAssignments(candidateId: number) {
  const db = getDb();
  await ensureDefaultAssessment(candidateId);
  const assignmentsRows = await db
    .select({
      assignment: assignments,
      assessment: assessments,
    })
    .from(assignments)
    .innerJoin(assessments, eq(assignments.assessmentId, assessments.id))
    .where(eq(assignments.candidateId, candidateId))
    .orderBy(desc(assignments.id));
  const result = [];
  for (const row of assignmentsRows) {
    const sections = await db
      .select({
        id: assessmentSections.id,
        title: assessmentSections.title,
        type: assessmentSections.type,
        durationMinutes: assessmentSections.durationMinutes,
        questionCount: assessmentSections.questionCount,
        sortOrder: assessmentSections.sortOrder,
        points: assessmentSections.points,
      })
      .from(assessmentSections)
      .where(eq(assessmentSections.assessmentId, row.assessment.id))
      .orderBy(assessmentSections.sortOrder);
    const session = (
      await db
        .select()
        .from(assessmentSessions)
        .where(
          and(
            eq(assessmentSessions.assignmentId, row.assignment.id),
            eq(assessmentSessions.candidateId, candidateId)
          )
        )
        .limit(1)
    )[0];
    const attemptsRows = session
      ? await db
          .select({
            sectionId: attempts.sectionId,
            score: attempts.score,
            maxScore: attempts.maxScore,
          })
          .from(attempts)
          .where(eq(attempts.sessionId, session.id))
      : [];
    const score = attemptsRows.reduce((n, a) => n + (a.score || 0), 0);
    const maxScore = sections.reduce((n, s) => n + (s.points || 0), 0);
    let assignmentStatus = row.assignment.status;
    if (
      assignmentStatus !== "completed" &&
      assignmentStatus !== "revoked" &&
      row.assignment.dueAt &&
      new Date() > row.assignment.dueAt
    ) {
      assignmentStatus = "expired";
      await db
        .update(assignments)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(assignments.id, row.assignment.id));
    }
    result.push({
      assignmentId: row.assignment.id,
      assessmentId: row.assessment.id,
      title: row.assessment.title,
      description: row.assessment.description,
      assignmentStatus,
      sessionStatus: session?.status ?? "created",
      availableFrom: row.assignment.availableFrom,
      dueAt: row.assignment.dueAt,
      completedAt: session?.completedAt ?? null,
      sections,
      score,
      maxScore,
      results: attemptsRows,
    });
  }
  return result;
}

export async function getAdminAssignments(createdBy: number) {
  const db = getDb();
  const rows = await db
    .select({
      assignment: assignments,
      assessment: assessments,
      candidate: users,
    })
    .from(assignments)
    .innerJoin(assessments, eq(assignments.assessmentId, assessments.id))
    .innerJoin(users, eq(assignments.candidateId, users.id))
    .where(eq(assessments.createdBy, createdBy))
    .orderBy(desc(assignments.id))
    .limit(100);
  const result = [];
  for (const r of rows) {
    const sections = await db
      .select({
        points: assessmentSections.points,
        duration: assessmentSections.durationMinutes,
      })
      .from(assessmentSections)
      .where(eq(assessmentSections.assessmentId, r.assessment.id));
    result.push({
      assignmentId: r.assignment.id,
      title: r.assessment.title,
      candidateEmail: r.candidate.email,
      candidateName: r.candidate.name,
      assignmentStatus: r.assignment.status,
      availableFrom: r.assignment.availableFrom,
      dueAt: r.assignment.dueAt,
      maxScore: sections.reduce((n, x) => n + x.points, 0),
      totalMinutes: sections.reduce((n, x) => n + x.duration, 0),
    });
  }
  return result;
}

export async function createAssessmentAndAssignment(input: {
  createdBy: number;
  candidateEmail: string;
  title: string;
  description?: string;
  sections: Array<{
    type: "aptitude" | "coding" | "project";
    sortOrder: number;
  }>;
  availableFrom?: Date;
  dueAt?: Date;
}) {

const requiredSections = [
  "aptitude",
  "coding",
  "project",
] as const;

if (
  input.sections.length !== requiredSections.length ||
  input.sections
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .some(
      (section, index) =>
        section.type !== requiredSections[index] ||
        section.sortOrder !== index + 1
    )
) {
  throw new Error(
    "The assessment must contain exactly three stages in this order: Aptitude, DSA Coding, Bug Hunt."
  );
}

  const db = getDb();
  const candidate = (
    await db
      .select()
      .from(users)
      .where(eq(users.email, input.candidateEmail.trim().toLowerCase()))
      .limit(1)
  )[0];
  if (!candidate)
    throw new Error(
      "Candidate account was not found. Ask the candidate to sign in once with this Gmail first."
    );
  const defs = {
    aptitude: {
      title: "Quantitative Aptitude",
      durationMinutes: 60,
      questionCount: 30,
      points: 30,
    },
    coding: {
      title: "DSA Coding",
      durationMinutes: 120,
      questionCount: 3,
      points: 300,
    },
    project: {
      title: "Full-stack Bug Hunt",
      durationMinutes: 120,
      questionCount: 12,
      points: 200,
    },
  } as const;
  if (!input.sections.length)
    throw new Error("At least one assessment section is required.");

  const total = input.sections.reduce(
    (n, x) => n + defs[x.type].durationMinutes,
    0
  );

if (
  input.availableFrom &&
  input.dueAt &&
  input.availableFrom >= input.dueAt
) {
  throw new Error(
    "Assessment closing time must be after the opening time."
  );
}

  const assessment = (
    await db
      .insert(assessments)
      .values({
        title: input.title,
        description: input.description ?? null,
        type: input.sections[0].type,
        durationMinutes: total,
        status: "published",
        createdBy: input.createdBy,
      })
      .returning()
  )[0];
  if (!assessment) throw new Error("Failed to create assessment.");
  await db
    .insert(assessmentSections)
    .values(
      input.sections.map(x => ({
        assessmentId: assessment.id,
        title: defs[x.type].title,
        type: x.type,
        sortOrder: x.sortOrder,
        durationMinutes: defs[x.type].durationMinutes,
        questionCount: defs[x.type].questionCount,
        points: defs[x.type].points,
      }))
    );
  const existing = (
    await db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.assessmentId, assessment.id),
          eq(assignments.candidateId, candidate.id)
        )
      )
      .limit(1)
  )[0];
  const assignment =
    existing ??
    (
      await db
        .insert(assignments)
        .values({
          assessmentId: assessment.id,
          candidateId: candidate.id,
          assignedBy: input.createdBy,
          status: "assigned",
          availableFrom: input.availableFrom,
          dueAt: input.dueAt,
        })
        .returning()
    )[0];
  if (!assignment) throw new Error("Failed to create assignment.");
  return { assessment, assignment };
}

export async function createAssessmentSession(input: {
  assignmentId: number;
  candidateId: number;
}): Promise<AssessmentSession> {
  const db = getDb();
  const assignment = (
    await db
      .select({
        id: assignments.id,
        candidateId: assignments.candidateId,
        status: assignments.status,
        availableFrom: assignments.availableFrom,
        dueAt: assignments.dueAt,
      })
      .from(assignments)
      .where(eq(assignments.id, input.assignmentId))
      .limit(1)
  )[0];
  if (!assignment) throw new Error("Assignment not found");

  if (assignment.candidateId !== input.candidateId)
    throw new Error("Assignment does not belong to candidate");

  if (assignment.status === "completed" || assignment.status === "revoked")
    throw new Error("This assessment has already been completed or revoked");

  const now = new Date();
  if (assignment.availableFrom && now < assignment.availableFrom)
    throw new Error(
      `Assessment opens at ${assignment.availableFrom.toLocaleString()}`
    );
  if (assignment.dueAt && now > assignment.dueAt) {
    await db
      .update(assignments)
      .set({ status: "expired", updatedAt: now })
      .where(eq(assignments.id, input.assignmentId));
    throw new Error("Assessment window has expired");
  }
  const existing = (
    await db
      .select()
      .from(assessmentSessions)
      .where(eq(assessmentSessions.assignmentId, input.assignmentId))
      .limit(1)
  )[0];
  if (existing) return existing;
  const inserted = await db
    .insert(assessmentSessions)
    .values({
      assignmentId: input.assignmentId,
      candidateId: input.candidateId,
      status: "created",
    })
    .returning();
  if (!inserted[0]) throw new Error("Failed to create assessment session");
  return inserted[0];
}

export async function getAssessmentSessionForCandidate(
  assignmentId: number,
  candidateId: number
) {
  return (
    await getDb()
      .select()
      .from(assessmentSessions)
      .where(
        and(
          eq(assessmentSessions.assignmentId, assignmentId),
          eq(assessmentSessions.candidateId, candidateId)
        )
      )
      .limit(1)
  )[0];
}

export async function startAssessmentSession(input: {
  assignmentId: number;
  candidateId: number;
}) {
  const db = getDb();
  const session = await createAssessmentSession(input);
  if (["completed", "abandoned", "invalidated"].includes(session.status))
    throw new Error("Assessment session is no longer available");
  if (session.status === "in_progress") return session;
  const now = new Date();
  const result = await db
    .update(assessmentSessions)
    .set({
      status: "in_progress",
      startedAt: session.startedAt ?? now,
      updatedAt: now,
    })
    .where(eq(assessmentSessions.id, session.id))
    .returning();
  await db
    .update(assignments)
    .set({ status: "started", updatedAt: now })
    .where(eq(assignments.id, input.assignmentId));
  if (!result[0]) throw new Error("Failed to start assessment session");
  return result[0];
}

export async function createAssessmentAttempt(input: {
  assignmentId: number;
  candidateId: number;
  sectionId?: number;
}) {
  const db = getDb();
  const assignment = (
    await db
      .select({
        id: assignments.id,
        candidateId: assignments.candidateId,
        assessmentId: assignments.assessmentId,
        status: assignments.status,
      })
      .from(assignments)
      .where(eq(assignments.id, input.assignmentId))
      .limit(1)
  )[0];
  if (!assignment) throw new Error("Assignment not found");
  if (assignment.candidateId !== input.candidateId)
    throw new Error("Assignment does not belong to candidate");
  if (assignment.status === "completed" || assignment.status === "revoked")
    throw new Error("Assessment is already closed");
  const session = await createAssessmentSession(input);
  if (!input.sectionId) {
    const active = (
      await db
        .select()
        .from(attempts)
        .where(
          and(
            eq(attempts.sessionId, session.id),
            inArray(attempts.status, ["preflight", "in_progress"])
          )
        )
        .orderBy(desc(attempts.id))
        .limit(1)
    )[0];
    if (active) return active;
  }
  let sectionId = input.sectionId;
  if (!sectionId)
    sectionId = (
      await db
        .select({ id: assessmentSections.id })
        .from(assessmentSections)
        .where(eq(assessmentSections.assessmentId, assignment.assessmentId))
        .orderBy(assessmentSections.sortOrder)
        .limit(1)
    )[0]?.id;
  if (!sectionId) throw new Error("Assessment has no sections configured");
  const section = (
    await db
      .select({
        id: assessmentSections.id,
        assessmentId: assessmentSections.assessmentId,
        points: assessmentSections.points,
        sortOrder: assessmentSections.sortOrder,
      })
      .from(assessmentSections)
      .where(eq(assessmentSections.id, sectionId))
      .limit(1)
  )[0];

  if (!section || section.assessmentId !== assignment.assessmentId)
    throw new Error("Assessment section does not belong to assignment");

const completedSections = await db
  .select({
    sectionId: attempts.sectionId,
    sortOrder: assessmentSections.sortOrder,
    status: attempts.status,
  })
  .from(attempts)
  .innerJoin(
    assessmentSections,
    eq(attempts.sectionId, assessmentSections.id)
  )
  .where(eq(attempts.sessionId, session.id));

const firstSection = (
  await db
    .select({
      id: assessmentSections.id,
      sortOrder: assessmentSections.sortOrder,
    })
    .from(assessmentSections)
    .where(eq(assessmentSections.assessmentId, assignment.assessmentId))
    .orderBy(assessmentSections.sortOrder)
    .limit(1)
)[0];

if (
  firstSection &&
  sectionId !== firstSection.id &&
  !completedSections.some(
    row =>
      row.sortOrder === section.sortOrder - 1 &&
      row.status === "completed"
  )
) {
  throw new Error("Assessment stages must be completed in order.");
}  

  const existing = (
    await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.sessionId, session.id),
          eq(attempts.sectionId, sectionId)
        )
      )
      .limit(1)
  )[0];
  if (existing) return existing;
  const inserted = await db
    .insert(attempts)
    .values({
      assignmentId: input.assignmentId,
      candidateId: input.candidateId,
      sessionId: session.id,
      sectionId,
      status: "created",
      responseData: {},
      maxScore: section.points,
    })
    .returning();
  if (!inserted[0]) throw new Error("Failed to create assessment attempt");
  return inserted[0];
}

export async function getAssessmentAttemptForCandidate(
  attemptId: number,
  candidateId: number
) {
  return (
    await getDb()
      .select()
      .from(attempts)
      .where(
        and(eq(attempts.id, attemptId), eq(attempts.candidateId, candidateId))
      )
      .limit(1)
  )[0];
}

export async function getCurrentAssessmentAttempt(
  assignmentId: number,
  candidateId: number
) {
  const rows = await getDb()
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.assignmentId, assignmentId),
        eq(attempts.candidateId, candidateId)
      )
    )
    .orderBy(attempts.id);
  return rows
    .reverse()
    .find(attempt => ["preflight", "in_progress"].includes(attempt.status));
}

export async function updateAssessmentAttemptStatus(
  attemptId: number,
  status: AssessmentAttempt["status"],
  options?: { allowExpiredCompletion?: boolean }
) {
  const db = getDb();
  const now = new Date();
  const row = (
    await db
      .select({
        attempt: attempts,
        duration: assessmentSections.durationMinutes,
      })
      .from(attempts)
      .leftJoin(
        assessmentSections,
        eq(attempts.sectionId, assessmentSections.id)
      )
      .where(eq(attempts.id, attemptId))
      .limit(1)
  )[0];
  if (!row) return undefined;
  const expired = row.attempt.deadlineAt && now >= row.attempt.deadlineAt;
  if (expired && !(status === "completed" && options?.allowExpiredCompletion))
    throw new Error("Assessment stage deadline has expired");
  const values: any = { status, updatedAt: now };
  if (status === "preflight") values.startedAt = row.attempt.startedAt ?? now;
  if (status === "in_progress") {
    values.startedAt = row.attempt.startedAt ?? now;
    if (!row.attempt.deadlineAt && row.duration != null) {
      values.deadlineAt = new Date(
        now.getTime() + row.duration * 60_000
      );
    }
  }
  if (status === "submitted") values.submittedAt = now;
  if (status === "completed") {
    values.completedAt = now;
    values.submittedAt = row.attempt.submittedAt ?? now;
  }
  return (
    await db
      .update(attempts)
      .set(values)
      .where(eq(attempts.id, attemptId))
      .returning()
  )[0];
}

export async function updateAttemptResponseData(
  attemptId: number,
  candidateId: number,
  patch: Record<string, unknown>
) {
  const db = getDb();
  const current = await getAssessmentAttemptForCandidate(
    attemptId,
    candidateId
  );
  if (!current) throw new Error("Assessment attempt not found");
  if (
    ["completed", "submitted", "abandoned", "invalidated"].includes(
      current.status
    )
  )
    throw new Error("Assessment attempt is closed");
  if (current.deadlineAt && new Date() >= current.deadlineAt)
    throw new Error("Assessment stage deadline has expired");
  const data = {
    ...((current.responseData as Record<string, unknown>) || {}),
    ...patch,
  };
  const updated = await db
    .update(attempts)
    .set({ responseData: data, updatedAt: new Date() })
    .where(eq(attempts.id, attemptId))
    .returning();
  return updated[0];
}

export async function startAttemptPreflight(
  attemptId: number,
  candidateId: number
) {
  const attempt = await getAssessmentAttemptForCandidate(
    attemptId,
    candidateId
  );
  if (!attempt) throw new Error("Assessment attempt not found");
  if (attempt.status !== "created") return attempt;
  return updateAssessmentAttemptStatus(attemptId, "preflight");
}

export async function createPreflightCheck(input: {
  attemptId: number;
  candidateId: number;
  cameraAvailable: boolean;
  microphoneAvailable: boolean;
  screenShareAvailable: boolean;
  browserFocusAvailable: boolean;
  networkAvailable: boolean;
  passed: boolean;
}) {
  const attempt = await getAssessmentAttemptForCandidate(
    input.attemptId,
    input.candidateId
  );
  if (!attempt) throw new Error("Assessment attempt not found");
  const check = (
    await getDb()
      .insert(preflightChecks)
      .values({
        attemptId: input.attemptId,
        cameraAvailable: input.cameraAvailable,
        microphoneAvailable: input.microphoneAvailable,
        screenShareAvailable: input.screenShareAvailable,
        browserFocusAvailable: input.browserFocusAvailable,
        networkAvailable: input.networkAvailable,
        passed: input.passed,
      })
      .returning()
  )[0];
  if (!check) throw new Error("Failed to record preflight check");
  if (input.passed) {
    const started = await updateAssessmentAttemptStatus(
      input.attemptId,
      "in_progress"
    );
    return { check, attempt: started };
  }
  return { check, attempt };
}

export async function createEvidenceEvent(input: {
  attemptId: number;
  candidateId: number;
  category: EvidenceEvent["category"];
  eventType: string;
  severity?: EvidenceEvent["severity"];
  occurredAt?: Date;
  durationMs?: number;
  confidence?: number;
  metadata?: Record<string, unknown>;
}) {
  const attempt = await getAssessmentAttemptForCandidate(
    input.attemptId,
    input.candidateId
  );
  if (!attempt) throw new Error("Assessment attempt not found");
  const result = await getDb()
    .insert(evidenceEvents)
    .values({
      attemptId: input.attemptId,
      category: input.category,
      eventType: input.eventType,
      severity: input.severity ?? "info",
      occurredAt: input.occurredAt ?? new Date(),
      durationMs: input.durationMs,
      confidence: input.confidence,
      metadata: input.metadata,
    })
    .returning();
  if (!result[0]) throw new Error("Failed to record evidence event");
  return result[0];
}

export async function getNextAssessmentSection(input: {
  assessmentId: number;
  currentSectionId: number;
}) {
  const db = getDb();
  const current = (
    await db
      .select({ sortOrder: assessmentSections.sortOrder })
      .from(assessmentSections)
      .where(eq(assessmentSections.id, input.currentSectionId))
      .limit(1)
  )[0];
  if (!current) throw new Error("Current assessment section not found");
  return (
    await db
      .select()
      .from(assessmentSections)
      .where(
        and(
          eq(assessmentSections.assessmentId, input.assessmentId),
          gt(assessmentSections.sortOrder, current.sortOrder)
        )
      )
      .orderBy(assessmentSections.sortOrder)
      .limit(1)
  )[0];
}

export async function completeAssessmentSession(
  sessionId: number,
  candidateId: number
) {
  const db = getDb();
  const session = (
    await db
      .select()
      .from(assessmentSessions)
      .where(
        and(
          eq(assessmentSessions.id, sessionId),
          eq(assessmentSessions.candidateId, candidateId)
        )
      )
      .limit(1)
  )[0];
  if (!session) throw new Error("Assessment session not found");
  const now = new Date();
  const result = (
    await db
      .update(assessmentSessions)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(eq(assessmentSessions.id, sessionId))
      .returning()
  )[0];
  await db
    .update(assignments)
    .set({ status: "completed", updatedAt: now })
    .where(eq(assignments.id, session.assignmentId));
  return result;
}

export async function calculateAttemptScore(attemptId: number) {
  const db = getDb();
  const row = (
    await db
      .select({ attempt: attempts, section: assessmentSections })
      .from(attempts)
      .leftJoin(
        assessmentSections,
        eq(attempts.sectionId, assessmentSections.id)
      )
      .where(eq(attempts.id, attemptId))
      .limit(1)
  )[0];
  if (!row) return { score: 0, maxScore: 0 };
  const data = (row.attempt.responseData ?? {}) as Record<string, any>;
  let score = 0;
  const maxScore = row.section?.points ?? row.attempt.maxScore ?? 0;
  if (row.section?.type === "aptitude") {
    const answers = data.answers ?? {};
    const key = [
      1, 0, 2, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 1, 2, 2, 1, 2, 1, 2, 2, 1, 1, 2, 2,
      2, 2, 2, 1, 1,
    ];
    score = Array.from(
      { length: 30 },
      (_, i) => answers[`apt-${i + 1}`] === key[i]
    ).filter(Boolean).length;
  } else if (row.section?.type === "coding") {
    const subs = data.codingSubmissions ?? {};
    score = await gradeCodingSubmission(subs);
  } else if (row.section?.type === "project") {
    score = await gradeBugHuntSubmission(data.bugHunt);
  }
  await db
    .update(attempts)
    .set({ score, maxScore, updatedAt: new Date() })
    .where(eq(attempts.id, attemptId));
  return { score, maxScore };
}

export async function completeAssessmentStage(input: {
  attemptId: number;
  candidateId: number;
  automatic?: boolean;
}) {
  const db = getDb();

  const current = (
    await db
      .select({
        attempt: attempts,
        assessmentId: assignments.assessmentId,
        section: assessmentSections,
      })
      .from(attempts)
      .innerJoin(assignments, eq(attempts.assignmentId, assignments.id))
      .leftJoin(
        assessmentSections,
        eq(attempts.sectionId, assessmentSections.id)
      )
      .where(
        and(
          eq(attempts.id, input.attemptId),
          eq(attempts.candidateId, input.candidateId)
        )
      )
      .limit(1)
  )[0];

  if (
    !current?.attempt.sessionId ||
    !current.attempt.sectionId ||
    !current.section
  ) {
    throw new Error("Assessment attempt is not attached to a session");
  }

  if ( current.attempt.status === "completed" ||
  current.attempt.status === "submitted") {
    throw new Error("Assessment stage is already completed");
  }

  if (current.attempt.status !== "in_progress") {
    throw new Error("Assessment stage is not active");
  }

  const now = new Date();

  const expired =
    !!current.attempt.deadlineAt && now >= current.attempt.deadlineAt;

  if (expired && !input.automatic) {
    throw new Error(
      "Section time has expired. The section was submitted automatically."
    );
  }

  if (input.automatic && !expired) {
    throw new Error(
      "Automatic stage completion is only allowed after the deadline."
    );
  }

  const score = await calculateAttemptScore(input.attemptId);
  
  const completedAttempt = await updateAssessmentAttemptStatus(
    input.attemptId,
    "completed",
    { allowExpiredCompletion: input.automatic === true, }
  );

  if (!completedAttempt) throw new Error("Failed to complete assessment stage");
  
  const session = (
    await db
      .select()
      .from(assessmentSessions)
      .where(
        and(
          eq(assessmentSessions.id, current.attempt.sessionId),
          eq(assessmentSessions.candidateId, input.candidateId)
        )
      )
      .limit(1)
  )[0];

  if (!session) throw new Error("Assessment session not found");

  const nextSection = await getNextAssessmentSection({
    assessmentId: current.assessmentId,
    currentSectionId: current.attempt.sectionId,
  });

  if (!nextSection) {
    const completedSession = await completeAssessmentSession(
      session.id,
      input.candidateId
    );

    return {
      completedAttempt,
      session: completedSession,
      finished: true as const,
      score,
    };
  }
  
  const nextAttempt = await createAssessmentAttempt({
    assignmentId: current.attempt.assignmentId,
    candidateId: input.candidateId,
    sectionId: nextSection.id,
  });

  const startedNext = await updateAssessmentAttemptStatus(
    nextAttempt.id,
    "in_progress"
  );

  if (!startedNext) throw new Error("Failed to start next assessment stage");
  
  return {
    completedAttempt,
    nextAttempt: startedNext,
    session,
    finished: false as const,
    score,
  };
}
