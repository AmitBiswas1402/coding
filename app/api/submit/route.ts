import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, testCases, problems, aiEvaluations, contests, contestScores } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { mockRun } from "@/lib/sandbox/mock";
import {
  buildCodeEvaluationPrompt,
  parseEvaluationResponse,
} from "@/lib/ai/prompts/code-analysis";
import { chatCompletion, getModelForUseCase } from "@/lib/ai/client";

/**
 * Fire-and-forget AI evaluation. Runs asynchronously after submit returns.
 */
async function triggerAiEvaluation(
  submissionId: string,
  code: string,
  problemId: string,
  language: string
) {
  try {
    const [problem] = await db
      .select()
      .from(problems)
      .where(eq(problems.id, problemId))
      .limit(1);

    if (!problem) return;

    const { system, user } = buildCodeEvaluationPrompt(
      code,
      problem.statement,
      problem.constraints,
      language
    );

    const raw = await chatCompletion(system, user, {
      model: getModelForUseCase("codeAnalysis"),
      maxTokens: 2048,
      temperature: 0.2,
    });

    const evaluation = parseEvaluationResponse(raw);

    await db.insert(aiEvaluations).values({
      submissionId,
      correctnessScore: evaluation.correctness_score,
      timeComplexity: evaluation.time_complexity,
      spaceComplexity: evaluation.space_complexity,
      optimizationScore: evaluation.optimization_score,
      readabilityScore: evaluation.readability_score,
      edgeCaseScore: evaluation.edge_case_handling_score,
      issues: evaluation.issues,
      improvements: evaluation.improvement_suggestions,
      overallFeedback: evaluation.overall_feedback,
    });
  } catch (err) {
    console.error("AI evaluation failed for submission", submissionId, err);
  }
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    problemId?: string;
    code?: string;
    language?: string;
    roomId?: string;
    contestId?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { problemId, code, language, roomId, contestId } = body;
  if (!problemId || !code || !language) {
    return NextResponse.json(
      { error: "problemId, code, and language required" },
      { status: 400 }
    );
  }

  // ── Contest locking: reject submissions after contest ends ──
  if (contestId) {
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId))
      .limit(1);
    if (contest && new Date(contest.endsAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Contest has ended", locked: true },
        { status: 403 }
      );
    }
  }

  // Fetch ALL test cases (both sample and hidden)
  const allTestCases = await db
    .select()
    .from(testCases)
    .where(eq(testCases.problemId, problemId));

  const inputs = allTestCases.map((tc) => tc.input);
  const expectedOutputs = allTestCases.map((tc) => tc.expectedOutput);

  // Run against all test cases
  const result = mockRun(code, language, inputs, expectedOutputs);

  // Determine status based on results
  const status = result.passed === result.total ? "accepted" : "wrong_answer";

  const [sub] = await db
    .insert(submissions)
    .values({
      userId: user.id,
      problemId,
      roomId: roomId ?? null,
      contestId: contestId ?? null,
      language,
      code,
      status,
      runResult: {
        passed: result.passed,
        total: result.total,
        runtime: result.runtime,
        memory: result.memory,
        complexity: result.complexity,
        results: result.results || [],
      },
    })
    .returning();

  // ── Contest scoring: record score on first accepted submission ──
  if (contestId && status === "accepted" && sub?.id) {
    try {
      // Check if already scored for this problem
      const existingScore = await db
        .select()
        .from(contestScores)
        .where(
          and(
            eq(contestScores.contestId, contestId),
            eq(contestScores.userId, user.id),
            eq(contestScores.problemId, problemId)
          )
        )
        .limit(1);

      if (existingScore.length === 0) {
        // Count wrong attempts before this accepted submission
        const wrongAttempts = await db
          .select()
          .from(submissions)
          .where(
            and(
              eq(submissions.contestId, contestId),
              eq(submissions.userId, user.id),
              eq(submissions.problemId, problemId),
              ne(submissions.status, "accepted")
            )
          );

        // Get contest for duration calculation
        const [contest] = await db
          .select()
          .from(contests)
          .where(eq(contests.id, contestId))
          .limit(1);

        let speedBonus = 0;
        if (contest) {
          const totalDurationMs =
            new Date(contest.endsAt).getTime() - new Date(contest.startsAt).getTime();
          const elapsedMs = Date.now() - new Date(contest.startsAt).getTime();
          const elapsedRatio = Math.min(1, elapsedMs / totalDurationMs);
          speedBonus = Math.round(30 * (1 - elapsedRatio));
        }

        const penalty = wrongAttempts.length * 10;
        const finalScore = Math.max(0, 100 + speedBonus - penalty);

        await db.insert(contestScores).values({
          contestId,
          userId: user.id,
          problemId,
          submissionId: sub.id,
          score: finalScore,
          solvedAt: new Date(),
        });
      }
    } catch (err) {
      console.error("Contest scoring failed:", err);
    }
  }

  // Fire AI evaluation asynchronously (non-blocking)
  if (sub?.id) {
    triggerAiEvaluation(sub.id, code, problemId, language).catch(() => {});
  }

  return NextResponse.json({
    submissionId: sub?.id,
    status,
    message: status === "accepted" 
      ? "Accepted!" 
      : `${result.passed}/${result.total} test cases passed`,
    runResult: {
      passed: result.passed,
      total: result.total,
      runtime: result.runtime,
      memory: result.memory,
      complexity: result.complexity,
      results: result.results || [],
    },
  });
}
