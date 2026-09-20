import {
  aptitudeQuestions,
  codingProblems,
  bugHuntPacks,
} from "../shared/assessmentContent";

import type { FullStackId } from "../shared/languages";

export const aptitudeAnswerIndexes = [1, 0, 2, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 1, 2, 2, 1, 2, 1, 2, 2, 1, 1, 2, 2, 2, 2, 2, 1, 1];

export function getPublicAssessmentContent() {
  return {
    aptitude: aptitudeQuestions,
    coding: codingProblems,
    bugHunt: Object.fromEntries(Object.entries(bugHuntPacks).map(([language, pack]) => [language, pack])),
  };
}

export function getBugHuntPack(stackId: FullStackId) {
  return bugHuntPacks[stackId];
}
