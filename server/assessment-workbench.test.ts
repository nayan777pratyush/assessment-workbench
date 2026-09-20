import { describe, expect, it } from "vitest";
import { buildEvidenceSummary, calculateCodeChurn, classifyReview } from "../shared/assessment";

describe("assessment evidence analysis", () => {
  it("calculates code churn across meaningful checkpoints", () => {
    expect(calculateCodeChurn([
      { additions: 31, deletions: 0, time: "14:08:42" },
      { additions: 6, deletions: 3, time: "14:16:02" },
      { additions: 18, deletions: 7, time: "14:27:45" },
    ])).toEqual({
      commitCount: 3,
      totalAdditions: 55,
      totalDeletions: 10,
      netChange: 45,
      largestChange: 31,
    });
  });

  it("never escalates from a single benign signal to the highest priority", () => {
    expect(classifyReview({ focusEvents: 0, largeChangeBeforeSubmit: true, longInactivity: false, commitCount: 4 })).toBe("Review recommended");
    expect(classifyReview({ focusEvents: 0, largeChangeBeforeSubmit: false, longInactivity: false, commitCount: 4 })).toBe("Normal");
  });

  it("separates observed facts, inferences, and limitations", () => {
    const report = buildEvidenceSummary({ focusEvents: 2, largeChangeBeforeSubmit: true, longInactivity: false, commitCount: 4 });
    expect(report.facts).toContain("4 meaningful commits observed");
    expect(report.inferences).toContain("development appears incremental");
    expect(report.inferences).toContain("a large change occurred near submission");
    expect(report.recommendation).toBe("Elevated review priority");
    expect(report.limitation).toMatch(/do not establish unauthorized activity/);
  });
});
