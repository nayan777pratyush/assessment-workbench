export type CommitEvidence = {
  additions: number;
  deletions: number;
  time: string;
  state?: "checkpoint" | "test" | "submit";
};

export type ReviewEvidence = {
  focusEvents: number;
  largeChangeBeforeSubmit: boolean;
  longInactivity: boolean;
  commitCount: number;
};

export type ReviewLevel = "Normal" | "Review recommended" | "Elevated review priority";

export function calculateCodeChurn(commits: CommitEvidence[]) {
  const totalAdditions = commits.reduce((sum, commit) => sum + commit.additions, 0);
  const totalDeletions = commits.reduce((sum, commit) => sum + commit.deletions, 0);
  const largestChange = commits.reduce(
    (largest, commit) => Math.max(largest, commit.additions + commit.deletions),
    0,
  );

  return {
    commitCount: commits.length,
    totalAdditions,
    totalDeletions,
    netChange: totalAdditions - totalDeletions,
    largestChange,
  };
}

export function classifyReview(evidence: ReviewEvidence): ReviewLevel {
  const signals = [
    evidence.focusEvents >= 2,
    evidence.largeChangeBeforeSubmit,
    evidence.longInactivity,
  ].filter(Boolean).length;

  if (signals >= 2) return "Elevated review priority";
  if (signals >= 1) return "Review recommended";
  return "Normal";
}

export function buildEvidenceSummary(evidence: ReviewEvidence) {
  const facts = [
    `${evidence.commitCount} meaningful commits observed`,
    `${evidence.focusEvents} focus events recorded`,
  ];
  const inferences: string[] = [];

  if (evidence.commitCount >= 3) inferences.push("development appears incremental");
  if (evidence.largeChangeBeforeSubmit) inferences.push("a large change occurred near submission");
  if (evidence.longInactivity) inferences.push("a long inactivity interval warrants context");

  return {
    facts,
    inferences,
    recommendation: classifyReview(evidence),
    limitation: "Browser-observable signals do not establish unauthorized activity on their own.",
  };
}
