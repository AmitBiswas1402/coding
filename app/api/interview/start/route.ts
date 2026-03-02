import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { interviewSessions } from "@/lib/db/schema";
import { chatCompletion, getModelForUseCase } from "@/lib/ai/client";
import {
  buildInterviewQuestionPrompt,
  parseInterviewQuestion,
} from "@/lib/ai/prompts/interview-question";

const VALID_LEVELS = ["SDE-1", "SDE-2", "SDE-3"];
const VALID_CATEGORIES = ["MNC", "Startup", "Service Based", "Mixed"];

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { level?: string; companyCategory?: string; topic?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { level, companyCategory, topic } = body;

  if (!level || !VALID_LEVELS.includes(level)) {
    return NextResponse.json({ error: "Invalid level. Must be SDE-1, SDE-2, or SDE-3" }, { status: 400 });
  }
  if (!companyCategory || !VALID_CATEGORIES.includes(companyCategory)) {
    return NextResponse.json({ error: "Invalid company category" }, { status: 400 });
  }

  const resolvedTopic = topic || "Mixed";

  try {
    // Generate question via AI
    const { system, user: userPrompt } = buildInterviewQuestionPrompt({
      level,
      companyCategory,
      topic: resolvedTopic,
    });

    const raw = await chatCompletion(system, userPrompt, {
      model: getModelForUseCase("questionGen"),
      temperature: 0.7,
      maxTokens: 2048,
    });

    const question = parseInterviewQuestion(raw);

    // Calculate end time
    const now = new Date();
    const endsAt = new Date(now.getTime() + question.expected_time_minutes * 60 * 1000);

    // Insert session into DB
    const [session] = await db
      .insert(interviewSessions)
      .values({
        userId: user.id,
        level,
        companyCategory,
        topic: resolvedTopic,
        question,
        expectedTimeMinutes: question.expected_time_minutes,
        startedAt: now,
      })
      .returning({ id: interviewSessions.id });

    return NextResponse.json({
      sessionId: session.id,
      question,
      endsAt: endsAt.toISOString(),
      expectedTimeMinutes: question.expected_time_minutes,
    });
  } catch (e) {
    console.error("Interview start error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate interview question" },
      { status: 502 }
    );
  }
}
