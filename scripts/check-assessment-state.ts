import { getDb } from "../server/db";
import { assignments, assessmentSessions } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

async function main() {
  const db = getDb();

  const rows = await db
    .select({
      assignmentId: assignments.id,
      candidateId: assignments.candidateId,
      assessmentId: assignments.assessmentId,
      assignmentStatus: assignments.status,
      sessionId: assessmentSessions.id,
      sessionStatus: assessmentSessions.status,
    })
    .from(assignments)
    .leftJoin(
      assessmentSessions,
      eq(assessmentSessions.assignmentId, assignments.id),
    )
    .orderBy(desc(assignments.id));

  console.log(JSON.stringify(rows, null, 2));
}

main().catch((error) => {
  console.error("DATABASE CHECK FAILED:");
  console.error(error);
  process.exit(1);
});
