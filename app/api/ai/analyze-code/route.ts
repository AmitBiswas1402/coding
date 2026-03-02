import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { problems, aiEvaluations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  buildCodeEvaluationPrompt,
  parseEvaluationResponse,
} from "@/lib/ai/prompts/code-analysis";
import { chatCompletion, getModelForUseCase } from "@/lib/ai/client";

/**
 * POST — Run AI evaluation on code. Optionally links to a submission.
 * Body: { code, problemId, language, submissionId? }
 */
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    code?: string;
    problemId?: string;
    language?: string;
    submissionId?: string;
  } = {};
  try {
    body = await req.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    body = {};
  }
  const { code, problemId, language = "python", submissionId } = body;
  if (!code || !problemId) {
    return NextResponse.json(
      { error: "code and problemId required" },
      { status: 400 }
    );
  }

  // Fetch full problem details for the prompt
  const [problem] = await db
    .select()
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);

  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  const { system, user: userPrompt } = buildCodeEvaluationPrompt(
    code,
    problem.statement,
    problem.constraints,
    language
  );

  try {
    const raw = await chatCompletion(system, userPrompt, {
      model: getModelForUseCase("codeAnalysis"),
      maxTokens: 2048,
      temperature: 0.2,
    });

    const evaluation = parseEvaluationResponse(raw);

    // If submissionId is provided, persist the evaluation
    if (submissionId) {
      try {
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
      } catch (dbErr) {
        console.error("Failed to save AI evaluation:", dbErr);
        // Still return the evaluation even if DB save fails
      }
    }

    return NextResponse.json({ evaluation });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Evaluation failed" },
      { status: 502 }
    );
  }
}

/**
 * GET — Fetch a stored AI evaluation by submissionId.
 * Query: ?submissionId=uuid
 */
export async function GET(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get("submissionId");

  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId query parameter required" },
      { status: 400 }
    );
  }

  const [row] = await db
    .select()
    .from(aiEvaluations)
    .where(eq(aiEvaluations.submissionId, submissionId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ evaluation: null, status: "pending" });
  }

  return NextResponse.json({
    evaluation: {
      correctness_score: row.correctnessScore,
      time_complexity: row.timeComplexity,
      space_complexity: row.spaceComplexity,
      optimization_score: row.optimizationScore,
      readability_score: row.readabilityScore,
      edge_case_handling_score: row.edgeCaseScore,
      issues: row.issues,
      improvement_suggestions: row.improvements,
      overall_feedback: row.overallFeedback,
    },
    status: "complete",
  });
}
