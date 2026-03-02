import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, problems, aiEvaluations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chatCompletion, getModelForUseCase } from "@/lib/ai/client";
import {
  buildPostSubmitRecommendationPrompt,
  parsePostSubmitRecommendationResponse,
  type PostSubmitContext,
} from "@/lib/ai/prompts/post-submission-recommendation";

/**
 * GET — Generate post-submission recommendations based on AI evaluation.
 * Query: ?submissionId=uuid
 */
export async function GET(req: Request) {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId query parameter required" },
        { status: 400 }
      );
    }

    // Fetch the submission
    const [submission] = await db
      .select({
        id: submissions.id,
        problemId: submissions.problemId,
        status: submissions.status,
        userId: submissions.userId,
      })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!submission || submission.userId !== user.id) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Fetch the problem
    const [problem] = await db
      .select()
      .from(problems)
      .where(eq(problems.id, submission.problemId))
      .limit(1);

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    // Fetch AI evaluation for this submission
    const [evaluation] = await db
      .select()
      .from(aiEvaluations)
      .where(eq(aiEvaluations.submissionId, submissionId))
      .limit(1);

    if (!evaluation) {
      return NextResponse.json(
        { error: "AI evaluation not ready yet", status: "pending" },
        { status: 202 }
      );
    }

    // Compute user stats: weak/strong topics, accuracy, retry count
    const allUserSubs = await db
      .select({
        problemId: submissions.problemId,
        status: submissions.status,
        problemTopic: problems.topic,
      })
      .from(submissions)
      .innerJoin(problems, eq(submissions.problemId, problems.id))
      .where(eq(submissions.userId, user.id));

    // Per-topic stats
    const topicMap = new Map<
      string,
      { attempted: Set<string>; solved: Set<string> }
    >();

    for (const sub of allUserSubs) {
      const topic = sub.problemTopic || "General";
      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          attempted: new Set<string>(),
          solved: new Set<string>(),
        });
      }
      const entry = topicMap.get(topic)!;
      entry.attempted.add(sub.problemId);
      if (sub.status === "accepted") {
        entry.solved.add(sub.problemId);
      }
    }

    const topicStats = Array.from(topicMap.entries()).map(
      ([topic, { attempted, solved }]) => ({
        topic,
        successRate:
          attempted.size > 0 ? (solved.size / attempted.size) * 100 : 0,
        attempted: attempted.size,
      })
    );

    const strongTopics = topicStats
      .filter((t) => t.attempted >= 2 && t.successRate >= 70)
      .map((t) => t.topic);
    const weakTopics = topicStats
      .filter((t) => t.attempted >= 1 && t.successRate <= 50)
      .map((t) => t.topic);

    const accepted = allUserSubs.filter((s) => s.status === "accepted").length;
    const avgAccuracy =
      allUserSubs.length > 0 ? (accepted / allUserSubs.length) * 100 : 0;

    // Count retries for this specific problem
    const retryCount = allUserSubs.filter(
      (s) => s.problemId === submission.problemId
    ).length;

    const diffLabel =
      problem.difficulty === 1
        ? "Easy"
        : problem.difficulty === 2
          ? "Medium"
          : "Hard";

    const ctx: PostSubmitContext = {
      problemTitle: problem.title,
      problemTopic: problem.topic || "General",
      problemDifficulty: diffLabel as "Easy" | "Medium" | "Hard",
      correctnessScore: evaluation.correctnessScore,
      timeComplexity: evaluation.timeComplexity,
      spaceComplexity: evaluation.spaceComplexity,
      optimizationScore: evaluation.optimizationScore,
      readabilityScore: evaluation.readabilityScore,
      edgeCaseScore: evaluation.edgeCaseScore,
      retryCount,
      weakTopics,
      strongTopics,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
    };

    const { system, user: userPrompt } =
      buildPostSubmitRecommendationPrompt(ctx);
    const raw = await chatCompletion(system, userPrompt, {
      model: getModelForUseCase("default"),
      maxTokens: 1000,
      temperature: 0.7,
    });

    const result = parsePostSubmitRecommendationResponse(raw);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Post-submit recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
