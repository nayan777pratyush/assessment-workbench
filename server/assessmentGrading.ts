import { runCoding, runBugHunt } from "./codeRunner";

const DSA_PROBLEMS = [
  "two-sum",
  "valid-parentheses",
  "merge-intervals",
] as const;

export async function gradeCodingSubmission(
  submissions: Record<string, any>,
) {
  let score = 0;

  for (const problemId of DSA_PROBLEMS) {
    const submission = submissions[problemId];

    if (!submission?.code || !submission?.language) continue;

    const result = await runCoding(
      problemId,
      submission.language,
      submission.code,
      false,
    );

    if (result.passed === result.total) {
      score += 100;
    }
  }

  return score;
}

export async function gradeBugHuntSubmission(
  bugHunt: any,
) {
  if (!bugHunt?.stackId || !bugHunt?.files) {
    return 0;
  }

  const result = await runBugHunt(
    bugHunt.stackId,
    bugHunt.files,
  );

  return result.total > 0
    ? Math.round((200 * result.passed) / result.total)
    : 0;
}