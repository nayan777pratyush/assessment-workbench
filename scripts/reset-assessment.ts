import "dotenv/config";

import { and, eq } from "drizzle-orm";

import { getDb } from "../server/db";

import {
  assessmentSessions,
  assessments,
  assignments,
  users,
} from "../drizzle/schema";


async function main() {

  console.log("Assessment reset script started.");

  const db = getDb();

  console.log("Database client initialized.");

  const emails = process.argv
    .slice(2)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  console.log("Looking for default assessment...");

  const assessment = (
    await db
      .select({
        id: assessments.id,
        title: assessments.title,
      })
      .from(assessments)
      .where(
        eq(
          assessments.title,
          "Assessment Workbench — Full Assessment",
        ),
      )
      .limit(1)
  )[0];


  if (!assessment) {
    throw new Error(
      'Default assessment "Assessment Workbench — Full Assessment" was not found.',
    );
  }

  const candidates = emails.length
    ? await db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .where(eq(users.email, emails[0]))
    : await db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users);

  if (!candidates.length) {
    throw new Error("No matching users found.");
  }

  for (const candidate of candidates) {
    const assignment = (
      await db
        .select({
          id: assignments.id,
        })
        .from(assignments)
        .where(
          and(
            eq(assignments.assessmentId, assessment.id),
            eq(assignments.candidateId, candidate.id),
          ),
        )
        .limit(1)
    )[0];

    if (!assignment) {
      console.log(
        `No assignment for ${candidate.email}; skipping.`,
      );
      continue;
    }

    await db
      .delete(assessmentSessions)
      .where(
        eq(
          assessmentSessions.assignmentId,
          assignment.id,
        ),
      );

    await db
      .update(assignments)
      .set({
        status: "assigned",
        dueAt: null,
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, assignment.id));

    console.log(
      `Reset ${candidate.email} (assignment #${assignment.id}) to a fresh test.`,
    );
  }

  console.log("Assessment reset complete.");
}

main().catch((error) => {
  console.error("Assessment reset failed:");
  console.error(error);
  process.exit(1);
});