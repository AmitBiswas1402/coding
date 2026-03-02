import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, problems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chatCompletion, AI_MODELS } from "@/lib/ai/client";
import {
  buildRecommendationPrompt,
  parseRecommendationResponse,
  type UserProfile,
} from "@/lib/ai/prompts/recommendation";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user submissions with their associated problems
    const userSubmissions = await db
      .select({
        submissionId: submissions.id,
        status: submissions.status,
        problemId: submissions.problemId,
        problemTitle: problems.title,
        problemDifficulty: problems.difficulty,
        problemTopic: problems.topic,
      })
      .from(submissions)
      .innerJoin(problems, eq(submissions.problemId, problems.id))
      .where(eq(submissions.userId, user.id));

    // Build per-topic stats
    const topicMap = new Map<
      string,
      { attempted: Set<string>; solved: Set<string> }
    >();
    const diffStats = {
      easy: { attempted: new Set<string>(), solved: new Set<string>() },
      medium: { attempted: new Set<string>(), solved: new Set<string>() },
      hard: { attempted: new Set<string>(), solved: new Set<string>() },
    };

    const allSolved = new Set<string>();
    const recentSolvedTitles: string[] = [];

    for (const sub of userSubmissions) {
      const topic = sub.problemTopic || "General";
      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          attempted: new Set<string>(),
          solved: new Set<string>(),
        });
      }
      const entry = topicMap.get(topic)!;
      entry.attempted.add(sub.problemId);

      // Difficulty bucket
      const diffKey =
        sub.problemDifficulty === 1
          ? "easy"
          : sub.problemDifficulty === 2
            ? "medium"
            : "hard";
      diffStats[diffKey].attempted.add(sub.problemId);

      if (sub.status === "accepted") {
        entry.solved.add(sub.problemId);
        diffStats[diffKey].solved.add(sub.problemId);
        if (!allSolved.has(sub.problemId)) {
          allSolved.add(sub.problemId);
          recentSolvedTitles.push(sub.problemTitle);
        }
      }
    }

    const totalSubmissions = userSubmissions.length;
    const problemsSolved = allSolved.size;
    const accepted = userSubmissions.filter(
      (s) => s.status === "accepted"
    ).length;
    const accuracy =
      totalSubmissions > 0 ? (accepted / totalSubmissions) * 100 : 0;

    const topicStats = Array.from(topicMap.entries()).map(
      ([topic, { attempted, solved }]) => ({
        topic,
        attempted: attempted.size,
        solved: solved.size,
        successRate:
          attempted.size > 0 ? (solved.size / attempted.size) * 100 : 0,
      })
    );

    // Identify strong (>= 70% success rate) and weak (<= 50%) topics
    const strongTopics = topicStats
      .filter((t) => t.attempted >= 2 && t.successRate >= 70)
      .map((t) => t.topic);
    const weakTopics = topicStats
      .filter((t) => t.attempted >= 1 && t.successRate <= 50)
      .map((t) => t.topic);

    const profile: UserProfile = {
      totalSubmissions,
      problemsSolved,
      accuracy: Math.round(accuracy * 10) / 10,
      topicStats,
      difficultyDistribution: {
        easy: {
          attempted: diffStats.easy.attempted.size,
          solved: diffStats.easy.solved.size,
        },
        medium: {
          attempted: diffStats.medium.attempted.size,
          solved: diffStats.medium.solved.size,
        },
        hard: {
          attempted: diffStats.hard.attempted.size,
          solved: diffStats.hard.solved.size,
        },
      },
      recentlySolved: recentSolvedTitles.slice(-10).reverse(),
      strongTopics,
      weakTopics,
    };

    // If user has no submissions, return beginner-friendly defaults
    if (totalSubmissions === 0) {
      return NextResponse.json({
        recommendations: [
          {
            title: "Two Sum",
            topic: "Arrays",
            difficulty: "easy",
            reason:
              "The classic starting problem — builds hash map intuition.",
          },
          {
            title: "Valid Parentheses",
            topic: "Stacks",
            difficulty: "easy",
            reason:
              "Introduces stack-based problem solving, a FAANG interview staple.",
          },
          {
            title: "Best Time to Buy and Sell Stock",
            topic: "Arrays",
            difficulty: "easy",
            reason:
              "Teaches sliding window / single-pass optimization patterns.",
          },
          {
            title: "Linked List Cycle",
            topic: "Linked Lists",
            difficulty: "easy",
            reason:
              "Builds understanding of pointer manipulation and Floyd's algorithm.",
          },
          {
            title: "Maximum Subarray",
            topic: "Dynamic Programming",
            difficulty: "medium",
            reason:
              "Introduces Kadane's algorithm — a foundational DP technique.",
          },
        ],
        summary:
          "Welcome! You haven't solved any problems yet. Start with these beginner-friendly challenges to build your foundation.",
        profile,
      });
    }

    // Call AI for personalized recommendations
    const { system, user: userPrompt } = buildRecommendationPrompt(profile);
    const raw = await chatCompletion(system, userPrompt, {
      model: AI_MODELS.default,
      maxTokens: 1500,
      temperature: 0.7,
    });

    const result = parseRecommendationResponse(raw);

    return NextResponse.json({
      ...result,
      profile,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
