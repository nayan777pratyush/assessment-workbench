import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("auth_accounts_provider_account_unique").on(
      table.provider,
      table.providerAccountId,
    ),
  }),
);

export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ============================================================
 * ASSESSMENTS
 * ============================================================ */

export const assessmentType = pgEnum("assessment_type", [
  "aptitude",
  "coding",
  "project",
]);

export const assessmentStatus = pgEnum("assessment_status", [
  "draft",
  "published",
  "archived",
]);

export const assessmentSessionStatus = pgEnum("assessment_session_status", [
  "created",
  "in_progress",
  "completed",
  "abandoned",
  "invalidated",
]);

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),

  type: assessmentType("type").notNull(),

  durationMinutes: integer("duration_minutes").notNull(),

  status: assessmentStatus("status").default("draft").notNull(),

  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const assessmentSections = pgTable(
  "assessment_sections",
  {
    id: serial("id").primaryKey(),

    assessmentId: integer("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),

    title: text("title").notNull(),

    type: assessmentType("type").notNull(),

    sortOrder: integer("sort_order").notNull(),

    durationMinutes: integer("duration_minutes").notNull(),

    questionCount: integer("question_count"),

    points: integer("points").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    assessmentOrderIdx: index("assessment_sections_assessment_order_idx").on(
      table.assessmentId,
      table.sortOrder,
    ),

    assessmentTypeIdx: index("assessment_sections_assessment_type_idx").on(
      table.assessmentId,
      table.type,
    ),
  }),
);

/* ============================================================
 * ASSIGNMENTS
 * ============================================================ */

export const assignmentStatus = pgEnum("assignment_status", [
  "assigned",
  "started",
  "completed",
  "expired",
  "revoked",
]);

export const assignments = pgTable(
  "assignments",
  {
    id: serial("id").primaryKey(),

    assessmentId: integer("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),

    candidateId: integer("candidate_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    assignedBy: integer("assigned_by")
      .notNull()
      .references(() => users.id),

    status: assignmentStatus("status").default("assigned").notNull(),

    availableFrom: timestamp("available_from", { withTimezone: true }),

    dueAt: timestamp("due_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    candidateAssessmentUnique: uniqueIndex(
      "assignments_candidate_assessment_unique",
    ).on(table.candidateId, table.assessmentId),
  }),
);

export const assessmentSessions = pgTable(
  "assessment_sessions",
  {
    id: serial("id").primaryKey(),

    assignmentId: integer("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),

    candidateId: integer("candidate_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    status: assessmentSessionStatus("status")
      .notNull()
      .default("created"),

    startedAt: timestamp("started_at", { withTimezone: true }),

    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Legacy compatibility field. Stage timers never carry time forward.
    timeBankSeconds: integer("time_bank_seconds").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    assignmentUnique: uniqueIndex(
      "assessment_sessions_assignment_unique",
    ).on(table.assignmentId),

    candidateIdx: index("assessment_sessions_candidate_idx").on(
      table.candidateId,
    ),
  }),
);

/* ============================================================
 * ASSESSMENT ATTEMPTS
 * ============================================================ */

export const attemptStatus = pgEnum("attempt_status", [
  "created",
  "preflight",
  "in_progress",
  "submitted",
  "completed",
  "abandoned",
  "invalidated",
]);

export const attempts = pgTable(
  "assessment_attempts",
  {
    id: serial("id").primaryKey(),

    assignmentId: integer("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),

    candidateId: integer("candidate_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    sessionId: integer("session_id").references(() => assessmentSessions.id, {
      onDelete: "cascade",
    }),

    sectionId: integer("section_id").references(() => assessmentSections.id, {
      onDelete: "cascade",
    }),

    deadlineAt: timestamp("deadline_at", { withTimezone: true }),

    // Candidate work for this stage: answers, source code, run results, and bug-hunt files.
    responseData: jsonb("response_data").default({}).notNull(),

    score: integer("score").default(0).notNull(),

    maxScore: integer("max_score").default(0).notNull(),

    status: attemptStatus("status").default("created").notNull(),

    startedAt: timestamp("started_at", { withTimezone: true }),

    submittedAt: timestamp("submitted_at", { withTimezone: true }),

    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionSectionUnique: uniqueIndex(
      "assessment_attempts_session_section_unique",
    ).on(table.sessionId, table.sectionId),
  }),
);

/* ============================================================
 * PREFLIGHT
 * ============================================================ */

export const preflightChecks = pgTable("preflight_checks", {
  id: serial("id").primaryKey(),

  attemptId: integer("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),

  cameraAvailable: boolean("camera_available").notNull(),

  microphoneAvailable: boolean("microphone_available").notNull(),

  screenShareAvailable: boolean("screen_share_available").notNull(),

  browserFocusAvailable: boolean("browser_focus_available").notNull(),

  networkAvailable: boolean("network_available").notNull(),

  passed: boolean("passed").notNull(),

  checkedAt: timestamp("checked_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ============================================================
 * PROCTORING EVIDENCE
 * ============================================================ */

export const evidenceCategory = pgEnum("evidence_category", [
  "camera",
  "audio",
  "screen",
  "browser",
  "environment",
  "interaction",
  "assessment",
  "system",
]);

export const evidenceSeverity = pgEnum("evidence_severity", [
  "info",
  "low",
  "medium",
  "high",
  "critical",
]);

export const evidenceEvents = pgTable("evidence_events", {
  id: serial("id").primaryKey(),

  attemptId: integer("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),

  category: evidenceCategory("category").notNull(),

  eventType: varchar("event_type", { length: 64 }).notNull(),

  severity: evidenceSeverity("severity").default("info").notNull(),

  occurredAt: timestamp("occurred_at", {
    withTimezone: true,
  }).notNull(),

  durationMs: integer("duration_ms"),

  confidence: integer("confidence"),

  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ============================================================
 * INTEGRITY / RISK
 * ============================================================ */

export const riskLevel = pgEnum("risk_level", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const attemptRiskScores = pgTable("attempt_risk_scores", {
  id: serial("id").primaryKey(),

  attemptId: integer("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),

  score: integer("score").notNull(),

  level: riskLevel("level").notNull(),

  reasons: jsonb("reasons"),

  calculatedAt: timestamp("calculated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

/* ============================================================
 * RELATIONS
 * ============================================================ */

export const usersRelations = relations(users, ({ many }) => ({
  authAccounts: many(authAccounts),

  createdAssessments: many(assessments),

  assignmentsReceived: many(assignments, {
    relationName: "candidateAssignments",
  }),

  assignmentsCreated: many(assignments, {
    relationName: "createdAssignments",
  }),

  attempts: many(attempts),
}));

export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
  user: one(users, {
    fields: [authAccounts.userId],
    references: [users.id],
  }),
}));

export const assessmentsRelations = relations(
  assessments,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [assessments.createdBy],
      references: [users.id],
    }),

    assignments: many(assignments),
  }),
);

export const assessmentSectionsRelations = relations(
  assessmentSections,
  ({ one, many }) => ({
    assessment: one(assessments, {
      fields: [assessmentSections.assessmentId],
      references: [assessments.id],
    }),

    attempts: many(attempts),
  }),
);

export const assessmentSessionsRelations = relations(
  assessmentSessions,
  ({ one, many }) => ({
    assignment: one(assignments, {
      fields: [assessmentSessions.assignmentId],
      references: [assignments.id],
    }),

    candidate: one(users, {
      fields: [assessmentSessions.candidateId],
      references: [users.id],
    }),

    attempts: many(attempts),
  }),
);

export const assignmentsRelations = relations(
  assignments,
  ({ one, many }) => ({
    assessment: one(assessments, {
      fields: [assignments.assessmentId],
      references: [assessments.id],
    }),

    candidate: one(users, {
      fields: [assignments.candidateId],
      references: [users.id],
      relationName: "candidateAssignments",
    }),

    assignedByUser: one(users, {
      fields: [assignments.assignedBy],
      references: [users.id],
      relationName: "createdAssignments",
    }),

    attempts: many(attempts),
  }),
);

export const attemptsRelations = relations(
  attempts,
  ({ one, many }) => ({
    assignment: one(assignments, {
      fields: [attempts.assignmentId],
      references: [assignments.id],
    }),

    candidate: one(users, {
      fields: [attempts.candidateId],
      references: [users.id],
    }),

    preflightChecks: many(preflightChecks),

    evidenceEvents: many(evidenceEvents),

    riskScores: many(attemptRiskScores),


    session: one(assessmentSessions, {
      fields: [attempts.sessionId],
      references: [assessmentSessions.id],
    }),

    section: one(assessmentSections, {
      fields: [attempts.sectionId],
      references: [assessmentSections.id],
    }),
  }),
);

export const preflightChecksRelations = relations(
  preflightChecks,
  ({ one }) => ({
    attempt: one(attempts, {
      fields: [preflightChecks.attemptId],
      references: [attempts.id],
    }),
  }),
);

export const evidenceEventsRelations = relations(
  evidenceEvents,
  ({ one }) => ({
    attempt: one(attempts, {
      fields: [evidenceEvents.attemptId],
      references: [attempts.id],
    }),
  }),
);

export const attemptRiskScoresRelations = relations(
  attemptRiskScores,
  ({ one }) => ({
    attempt: one(attempts, {
      fields: [attemptRiskScores.attemptId],
      references: [attempts.id],
    }),
  }),
);

/* ============================================================
 * TYPES
 * ============================================================ */

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type AuthAccount = typeof authAccounts.$inferSelect;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

export type AssessmentAttempt = typeof attempts.$inferSelect;
export type InsertAssessmentAttempt = typeof attempts.$inferInsert;

export type PreflightCheck = typeof preflightChecks.$inferSelect;
export type InsertPreflightCheck = typeof preflightChecks.$inferInsert;

export type EvidenceEvent = typeof evidenceEvents.$inferSelect;
export type InsertEvidenceEvent = typeof evidenceEvents.$inferInsert;

export type AttemptRiskScore = typeof attemptRiskScores.$inferSelect;
export type InsertAttemptRiskScore = typeof attemptRiskScores.$inferInsert;

export type AssessmentSection = typeof assessmentSections.$inferSelect;
export type NewAssessmentSection = typeof assessmentSections.$inferInsert;

export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type NewAssessmentSession = typeof assessmentSessions.$inferInsert;