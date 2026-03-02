import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, problems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chatCompletion, getModelForUseCase } from "@/lib/ai/client";
import {
  buildWeaknessAnalyticsPrompt,
  parseWeaknessAnalyticsResponse,
  type WeaknessAnalyticsInput,
} from "@/lib/ai/prompts/weakness-analytics";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all submissions with their problem info
  const allSubmissions = await db
    .select({
      id: submissions.id,
      problemId: submissions.problemId,
      status: submissions.status,
      submittedAt: submissions.submittedAt,
      problemTitle: problems.title,
      topic: problems.topic,
      difficulty: problems.difficulty,
    })
    .from(submissions)
    .innerJoin(problems, eq(submissions.problemId, problems.id))
    .where(eq(submissions.userId, user.id));

  if (allSubmissions.length === 0) {
    return NextResponse.json({
      result: {
        weak_topics: [],
        behavior_patterns: [
          {
            pattern: "No Data",
            severity: "low",
            description: "You haven't made any submissions yet. Start solving problems!",
          },
        ],
        risk_areas: [],
        improvement_plan: [
          {
            step: 1,
            action: "Solve your first problem",
            expected_outcome: "Begin building your performance profile",
          },
        ],
        confidence_score: 0,
      },
      stats: {
        totalAttempted: 0,
        totalSolved: 0,
        failedAttempts: 0,
        topicAccuracy: [],
      },
    });
  }

  // ── Per-problem retry counts ──
  const problemRetries = new Map<string, number>();
  for (const s of allSubmissions) {
    problemRetries.set(s.problemId, (problemRetries.get(s.problemId) ?? 0) + 1);
  }

  const retryValues = Array.from(problemRetries.values());
  const avgRetries =
    retryValues.reduce((a, b) => a + b, 0) / retryValues.length;
  const maxRetries = Math.max(...retryValues);

  // ── Per-topic accuracy ──
  const topicAttempts = new Map<string, Set<string>>(); // topic → Set of problemIds attempted
  const topicSolved = new Map<string, Set<string>>(); // topic → Set of problemIds solved
  const topicSubmissionCount = new Map<string, number>();

  for (const s of allSubmissions) {
    const topic = s.topic || "Unknown";

    if (!topicAttempts.has(topic)) topicAttempts.set(topic, new Set());
    topicAttempts.get(topic)!.add(s.problemId);

    topicSubmissionCount.set(
      topic,
      (topicSubmissionCount.get(topic) ?? 0) + 1
    );

    if (s.status === "accepted") {
      if (!topicSolved.has(topic)) topicSolved.set(topic, new Set());
      topicSolved.get(topic)!.add(s.problemId);
    }
  }

  const topicAccuracy = Array.from(topicAttempts.entries()).map(
    ([topic, attemptedSet]) => {
      const solvedSet = topicSolved.get(topic) ?? new Set();
      return {
        topic,
        attempted: attemptedSet.size,
        solved: solvedSet.size,
        accuracy:
          attemptedSet.size > 0
            ? (solvedSet.size / attemptedSet.size) * 100
            : 0,
      };
    }
  );

  // Find the most retried topic
  const topicRetryTotals = new Map<string, number>();
  for (const s of allSubmissions) {
    const topic = s.topic || "Unknown";
    topicRetryTotals.set(topic, (topicRetryTotals.get(topic) ?? 0) + 1);
  }
  let mostRetriedTopic = "N/A";
  let maxTopicRetries = 0;
  for (const [topic, count] of topicRetryTotals) {
    if (count > maxTopicRetries) {
      maxTopicRetries = count;
      mostRetriedTopic = topic;
    }
  }

  // ── Abandon rate ──
  const attemptedProblems = new Set(allSubmissions.map((s) => s.problemId));
  const solvedProblems = new Set(
    allSubmissions.filter((s) => s.status === "accepted").map((s) => s.problemId)
  );
  const abandoned = [...attemptedProblems].filter(
    (pid) => !solvedProblems.has(pid)
  );
  const abandonRate =
    attemptedProblems.size > 0
      ? abandoned.length / attemptedProblems.size
      : 0;

  // ── Avg submission gap time (only gaps < 2 hours) ──
  const sortedTimes = allSubmissions
    .map((s) =>
      s.submittedAt instanceof Date
        ? s.submittedAt.getTime()
        : new Date(String(s.submittedAt)).getTime()
    )
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  let gapSum = 0;
  let gapCount = 0;
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  for (let i = 1; i < sortedTimes.length; i++) {
    const gap = sortedTimes[i] - sortedTimes[i - 1];
    if (gap > 0 && gap < TWO_HOURS) {
      gapSum += gap;
      gapCount++;
    }
  }
  const avgTimeMinutes = gapCount > 0 ? gapSum / gapCount / 60000 : 0;

  // ── Build AI input ──
  const totalSolved = solvedProblems.size;
  const failedAttempts = allSubmissions.filter(
    (s) => s.status !== "accepted"
  ).length;

  const input: WeaknessAnalyticsInput = {
    totalSolved,
    failedAttempts,
    avgTimeMinutes,
    topicAccuracy,
    retryStats: {
      avgRetries,
      maxRetries,
      mostRetriedTopic,
    },
    abandonRate,
    totalProblemsAttempted: attemptedProblems.size,
  };

  const { system, user: userPrompt } = buildWeaknessAnalyticsPrompt(input);

  try {
    const raw = await chatCompletion(system, userPrompt, {
      model: getModelForUseCase("codeAnalysis"),
      maxTokens: 2000,
      temperature: 0.4,
    });

    const result = parseWeaknessAnalyticsResponse(raw);

    return NextResponse.json({
      result,
      stats: {
        totalAttempted: attemptedProblems.size,
        totalSolved,
        failedAttempts,
        topicAccuracy,
      },
    });
  } catch (err) {
    console.error("Weakness analytics AI error:", err);
    return NextResponse.json(
      { error: "AI analysis failed" },
      { status: 500 }
    );
  }
}
