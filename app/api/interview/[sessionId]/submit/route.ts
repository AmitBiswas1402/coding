import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { interviewSessions, interviewResults } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { chatCompletion, getModelForUseCase } from "@/lib/ai/client";
import {
  buildInterviewEvaluationPrompt,
  parseInterviewEvaluation,
} from "@/lib/ai/prompts/interview-evaluation";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  // Fetch and verify session
  const session = await db
    .select()
    .from(interviewSessions)
    .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, user.id)))
    .limit(1);

  if (!session.length) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const s = session[0];

  if (s.status !== "active") {
    return NextResponse.json(
      { error: `Session is already ${s.status}` },
      { status: 409 }
    );
  }

  // Check expiry
  const now = new Date();
  const endsAt = new Date(s.startedAt!.getTime() + s.expectedTimeMinutes * 60 * 1000);
  if (now > endsAt) {
    await db
      .update(interviewSessions)
      .set({ status: "expired", completedAt: endsAt })
      .where(eq(interviewSessions.id, sessionId));
    return NextResponse.json({ error: "Session has expired" }, { status: 410 });
  }

  let body: { code?: string; language?: string; solveTimeMinutes?: number; runAttempts?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { code, language, solveTimeMinutes, runAttempts } = body;

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }
  if (!language || typeof language !== "string") {
    return NextResponse.json({ error: "Language is required" }, { status: 400 });
  }

  const resolvedSolveTime = typeof solveTimeMinutes === "number" ? solveTimeMinutes : s.expectedTimeMinutes;
  const resolvedRunAttempts = typeof runAttempts === "number" ? runAttempts : 0;

  try {
    // AI evaluation
    const questionObj = s.question as {
      title: string;
      description: string;
      constraints: string;
      examples: { input: string; output: string; explanation?: string }[];
      difficulty_level: string;
      expected_time_minutes: number;
      hints: string[];
    };

    const { system, user: userPrompt } = buildInterviewEvaluationPrompt({
      question: JSON.stringify(questionObj),
      code,
      solveTimeMinutes: resolvedSolveTime,
      runAttempts: resolvedRunAttempts,
    });

    const raw = await chatCompletion(system, userPrompt, {
      model: getModelForUseCase("codeAnalysis"),
      temperature: 0.3,
      maxTokens: 3072,
    });

    const scores = parseInterviewEvaluation(raw);

    // Insert result
    const [result] = await db
      .insert(interviewResults)
      .values({
        sessionId,
        code,
        language,
        solveTimeMinutes: resolvedSolveTime,
        runAttempts: resolvedRunAttempts,
        scoresJson: scores,
        hireRecommendation: scores.hire_recommendation,
        completedAt: now,
      })
      .returning();

    // Update session status
    await db
      .update(interviewSessions)
      .set({ status: "completed", completedAt: now })
      .where(eq(interviewSessions.id, sessionId));

    return NextResponse.json({
      scores,
      result: {
        id: result.id,
        code: result.code,
        language: result.language,
        solveTimeMinutes: result.solveTimeMinutes,
        runAttempts: result.runAttempts,
        hireRecommendation: result.hireRecommendation,
        completedAt: result.completedAt?.toISOString(),
      },
    });
  } catch (e) {
    console.error("Interview submit error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Evaluation failed" },
      { status: 502 }
    );
  }
}
