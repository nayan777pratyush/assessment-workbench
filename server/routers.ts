import { z } from "zod";
import { clearSessionCookie } from "./_core/auth";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  completeAssessmentStage,
  createAssessmentAttempt,
  createAssessmentSession,
  createEvidenceEvent,
  createPreflightCheck,
  getAssessmentAttemptForCandidate,
  getCurrentAssessmentAttempt,
  getAssessmentSessionForCandidate,
  getCandidateAssessmentAssignment,
  getCandidateAssignments,
  getAdminAssignments,
  createAssessmentAndAssignment,
  startAssessmentSession,
  startAttemptPreflight,
  updateAttemptResponseData,
} from "./db";
import {
  getPublicAssessmentContent,
  aptitudeAnswerIndexes,
  getBugHuntPack,
} from "./assessmentContent";
import {
  runBugHunt,
  runCoding,
  starterCode,
  type CodingLanguage,
} from "./codeRunner";
import { codingProblems } from "../shared/assessmentContent";
import { getBugHuntAiHint } from "./ai";
import { DSA_LANGUAGES, FULL_STACKS, FullStackId } from "../shared/languages";

const codingLanguage = z.enum(DSA_LANGUAGES);
const fullStackId = z.enum(
  FULL_STACKS.map(stack => stack.id) as [
    FullStackId,
    ...FullStackId[]
  ]
);

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearSessionCookie(ctx.req, ctx.res);
      return { success: true } as const;
    }),
  }),
  assessment: router({
    getMyAssignment: protectedProcedure.query(({ ctx }) =>
      getCandidateAssessmentAssignment(ctx.user.id)
    ),
    getMyAssignments: protectedProcedure.query(({ ctx }) =>
      getCandidateAssignments(ctx.user.id)
    ),
    adminList: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Admin access required");
      return getAdminAssignments(ctx.user.id);
    }),
    adminCreate: protectedProcedure
      .input(
        z.object({
          title: z.string().min(3).max(255),
          description: z.string().max(2000).optional(),
          candidateEmail: z.string().email(),
          availableFrom: z.string().datetime().optional(),
          dueAt: z.string().datetime().optional(),
          sections: z
            .array(
              z.object({
                type: z.enum(["aptitude", "coding", "project"]),
                sortOrder: z.number().int().positive(),
              })
            )
            .min(1)
            .max(3),
        })
      )
      .mutation(({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new Error("Admin access required");
        return createAssessmentAndAssignment({
          ...input,
          createdBy: ctx.user.id,
          availableFrom: input.availableFrom
            ? new Date(input.availableFrom)
            : undefined,
          dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        });
      }),

    getContent: protectedProcedure.query(() => getPublicAssessmentContent()),

    startSession: protectedProcedure
      .input(z.object({ assignmentId: z.number().int().positive() }))
      .mutation(({ input, ctx }) =>
        startAssessmentSession({
          assignmentId: input.assignmentId,
          candidateId: ctx.user.id,
        })
      ),

    getSession: protectedProcedure
      .input(z.object({ assignmentId: z.number().int().positive() }))
      .query(({ input, ctx }) =>
        getAssessmentSessionForCandidate(input.assignmentId, ctx.user.id)
      ),

    createAttempt: protectedProcedure
      .input(
        z.object({
          assignmentId: z.number().int().positive(),
          sectionId: z.number().int().positive().optional(),
        })
      )
      .mutation(({ input, ctx }) =>
        createAssessmentAttempt({ ...input, candidateId: ctx.user.id })
      ),

    getAttempt: protectedProcedure
      .input(z.object({ attemptId: z.number().int().positive() }))
      .query(({ input, ctx }) =>
        getAssessmentAttemptForCandidate(input.attemptId, ctx.user.id)
      ),

    getCurrentAttempt: protectedProcedure
      .input(z.object({ assignmentId: z.number().int().positive() }))
      .query(({ input, ctx }) =>
        getCurrentAssessmentAttempt(input.assignmentId, ctx.user.id)
      ),

    startPreflight: protectedProcedure
      .input(z.object({ attemptId: z.number().int().positive() }))
      .mutation(({ input, ctx }) =>
        startAttemptPreflight(input.attemptId, ctx.user.id)
      ),

completePreflight: protectedProcedure
  .input(
    z.object({
      attemptId: z.number().int().positive(),
      cameraAvailable: z.boolean(),
      microphoneAvailable: z.boolean(),
      screenShareAvailable: z.boolean(),
      browserFocusAvailable: z.boolean(),
      networkAvailable: z.boolean(),
    })
  )
  .mutation(({ input, ctx }) =>
    createPreflightCheck({
      ...input,
      candidateId: ctx.user.id,
      passed:
        input.cameraAvailable &&
        input.microphoneAvailable &&
        input.screenShareAvailable &&
        input.browserFocusAvailable &&
        input.networkAvailable,
    })
  ),

    saveResponse: protectedProcedure
      .input(
        z.object({
          attemptId: z.number().int().positive(),
          patch: z.record(z.string(), z.unknown()),
        })
      )
      .mutation(({ input, ctx }) =>
        updateAttemptResponseData(input.attemptId, ctx.user.id, input.patch)
      ),

    recordEvidence: protectedProcedure
      .input(
        z.object({
          attemptId: z.number().int().positive(),
          category: z.enum([
            "camera",
            "audio",
            "screen",
            "browser",
            "environment",
            "interaction",
            "assessment",
            "system",
          ]),
          eventType: z.string().min(1).max(64),
          severity: z
            .enum(["info", "low", "medium", "high", "critical"])
            .optional(),
          occurredAt: z.string().datetime().optional(),
          durationMs: z.number().int().nonnegative().optional(),
          confidence: z.number().min(0).max(1).optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(({ input, ctx }) =>
        createEvidenceEvent({
          ...input,
          candidateId: ctx.user.id,
          occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
        })
      ),

    runCode: protectedProcedure
      .input(
        z.object({
          attemptId: z.number().int().positive(),
          problemId: z.string(),
          language: codingLanguage,
          code: z.string().max(80_000),
          publicOnly: z.boolean().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const attempt = await getAssessmentAttemptForCandidate(
          input.attemptId,
          ctx.user.id
        );
        if (!attempt) throw new Error("Assessment attempt not found");
        if (attempt.status !== "in_progress")
          throw new Error("Coding stage is not active");
        if (attempt.deadlineAt && new Date() >= attempt.deadlineAt)
          throw new Error("Assessment stage deadline has expired");
        const problem = codingProblems.find(p => p.id === input.problemId);
        if (!problem) throw new Error("Coding problem not found");
        const result = await runCoding(
          input.problemId,
          input.language as CodingLanguage,
          input.code,
          input.publicOnly
        );
        const existing = (attempt.responseData as Record<string, any>) || {};
        const submissions = { ...(existing.codingSubmissions || {}) };
        submissions[input.problemId] = {
          language: input.language,
          code: input.code,
          lastRun: {
            ...result,
            fullSuite: !input.publicOnly,
            at: new Date().toISOString(),
          },
          attempted: true,
        };
        await updateAttemptResponseData(input.attemptId, ctx.user.id, {
          codingSubmissions: submissions,
        });
        await createEvidenceEvent({
          attemptId: input.attemptId,
          candidateId: ctx.user.id,
          category: "assessment",
          eventType: "code_run",
          metadata: {
            problemId: input.problemId,
            language: input.language,
            passed: result.passed,
            total: result.total,
          },
        });
        return result;
      }),

    getStarterCode: protectedProcedure
      .input(z.object({ problemId: z.string(), language: codingLanguage }))
      .query(({ input }) => ({
        code: starterCode(input.problemId, input.language as CodingLanguage),
      })),

    runBugHunt: protectedProcedure
      .input(
        z.object({
          attemptId: z.number().int().positive(),
          stackId: fullStackId,
          files: z.record(z.string(), z.string()),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const attempt = await getAssessmentAttemptForCandidate(
          input.attemptId,
          ctx.user.id
        );
        if (!attempt) throw new Error("Assessment attempt not found");
        if (attempt.status !== "in_progress")
          throw new Error("Bug Hunt stage is not active");
        if (attempt.deadlineAt && new Date() >= attempt.deadlineAt)
          throw new Error("Assessment stage deadline has expired");
        const pack = getBugHuntPack(input.stackId);
        if (!pack) throw new Error("Bug Hunt language pack not found");
        const result = await runBugHunt(input.stackId, input.files);
        await updateAttemptResponseData(input.attemptId, ctx.user.id, {
          bugHunt: {
            stackId: input.stackId,
            files: input.files,
            lastRun: { ...result, at: new Date().toISOString() },
          },
        });
        await createEvidenceEvent({
          attemptId: input.attemptId,
          candidateId: ctx.user.id,
          category: "assessment",
          eventType: "bug_hunt_run",
          metadata: {
            stackId: input.stackId,
            passed: result.passed,
            total: result.total,
          },
        });
        return result;
      }),

    chat: protectedProcedure
      .input(
        z.object({
          attemptId: z.number().int().positive(),
          message: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const attempt = await getAssessmentAttemptForCandidate(
          input.attemptId,
          ctx.user.id
        );
        if (!attempt || attempt.status !== "in_progress")
          throw new Error("Bug Hunt stage is not active");
        const response = await getBugHuntAiHint(input.message);
        await createEvidenceEvent({
          attemptId: input.attemptId,
          candidateId: ctx.user.id,
          category: "interaction",
          eventType: "bug_hunt_ai_chat",
          metadata: { messageLength: input.message.length },
        });
        return { response };
      }),

    submit: protectedProcedure
      .input(z.object({ attemptId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const attempt = await getAssessmentAttemptForCandidate(
          input.attemptId,
          ctx.user.id
        );
        if (!attempt) throw new Error("Assessment attempt not found");
        if (attempt.deadlineAt && new Date() >= attempt.deadlineAt)
          throw new Error("Assessment stage deadline has expired");
        return { ready: true };
      }),

    completeStage: protectedProcedure
      .input(
        z.object({
          attemptId: z.number().int().positive(),
          automatic: z.boolean().default(false),
        })
      )
      .mutation(({ input, ctx }) =>
        completeAssessmentStage({
          attemptId: input.attemptId,
          candidateId: ctx.user.id,
          automatic: input.automatic,
        })
      ),
  }),
});

export type AppRouter = typeof appRouter;
