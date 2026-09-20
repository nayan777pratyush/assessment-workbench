import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../server/db";
import { assignments, assessments, users } from "../drizzle/schema";

/**
 * Idempotently assigns the published Full Assessment to candidate accounts
 * that do not already have an assignment.
 *
 * Usage:
 *   pnpm exec tsx scripts/seed-assessment.ts
 *   pnpm exec tsx scripts/seed-assessment.ts pratyushbhattacharya7@gmail.com
 *
 * With no email argument, all normal user accounts are assigned the assessment.
 * Existing assignments are never duplicated.
 */

const db = getDb();
const requestedEmails = process.argv.slice(2).map((email) => email.trim().toLowerCase()).filter(Boolean);

const assessmentRows = await db
  .select({ id: assessments.id, title: assessments.title, status: assessments.status })
  .from(assessments)
  .where(eq(assessments.title, "Assessment Workbench — Full Assessment"))
  .limit(1);

const assessment = assessmentRows[0];
if (!assessment) {
  throw new Error("Published assessment was not found. Create/seed the assessment first.");
}
if (assessment.status !== "published") {
  throw new Error(`Assessment ${assessment.id} is not published (status: ${assessment.status}).`);
}

const candidates = await db
  .select({ id: users.id, email: users.email, role: users.role })
  .from(users)
  .where(
    requestedEmails.length === 1
      ? eq(users.email, requestedEmails[0])
      : requestedEmails.length > 1
        ? inArray(users.email, requestedEmails)
        : eq(users.role, "user"),
  );

const filteredCandidates = candidates;

const assignedBy = (await db.select({ id: users.id }).from(users).limit(1))[0];
if (!assignedBy) throw new Error("No user exists to record assignedBy.");

for (const candidate of filteredCandidates) {
  if (candidate.role === "admin") continue;

  const existing = await db
    .select({ id: assignments.id, status: assignments.status })
    .from(assignments)
    .where(and(eq(assignments.candidateId, candidate.id), eq(assignments.assessmentId, assessment.id)))
    .limit(1);

  if (existing[0]) {
    console.log(`Already assigned: ${candidate.email ?? `user#${candidate.id}`} (assignment #${existing[0].id}, ${existing[0].status})`);
    continue;
  }

  const inserted = await db
    .insert(assignments)
    .values({
      assessmentId: assessment.id,
      candidateId: candidate.id,
      assignedBy: assignedBy.id,
      status: "assigned",
    })
    .returning({ id: assignments.id });

  console.log(`Assigned assessment #${assessment.id} to ${candidate.email ?? `user#${candidate.id}`} (assignment #${inserted[0]?.id})`);
}

console.log("Assignment seed complete.");
