import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { problems, testCases, aiGeneratedQuestions } from "@/lib/db/schema";
import { buildQuestionGenPrompt } from "@/lib/ai/prompts/question-gen";
import { chatCompletion, getModelForUseCase } from "@/lib/ai/client";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    level?: string;
    companyType?: string;
    topic?: string;
    sourceStyle?: string;
  } = {};
  try {
    body = await req.json();
  } catch (error) {
    // Handle empty body or invalid JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    body = {};
  }
  const level = body.level ?? "SDE-1";
  const companyType = body.companyType ?? "MNCs";
  const topic = body.topic ?? "Arrays";
  const sourceStyle = body.sourceStyle ?? "LeetCode";

  const { system, user: userPrompt } = buildQuestionGenPrompt({
    level,
    companyType,
    topic,
    sourceStyle,
  });

  let raw: string;
  try {
    raw = await chatCompletion(system, userPrompt, {
      model: getModelForUseCase("questionGen"),
      maxTokens: 4096,
      temperature: 0.8,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 502 }
    );
  }

  let parsed: Record<string, unknown>;
  try {
    // Clean the response - remove markdown code blocks if present
    let cleaned = raw.trim();
    
    // Remove ```json at the start
    cleaned = cleaned.replace(/^```json\s*/i, "");
    // Remove ``` at the end
    cleaned = cleaned.replace(/\s*```$/g, "");
    // Remove any remaining ``` markers
    cleaned = cleaned.replace(/```/g, "");
    cleaned = cleaned.trim();
    
    // Check if cleaned string is empty
    if (!cleaned) {
      return NextResponse.json(
        { error: "Empty response from AI. Please try again." },
        { status: 502 }
      );
    }
    
    // Try to find JSON object in the response if it's embedded in text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch (error) {
    console.error("JSON parsing error:", error);
    console.error("Raw AI response:", raw);
    return NextResponse.json(
      { 
        error: "Invalid JSON from AI. The AI response may be incomplete or malformed.",
        details: error instanceof Error ? error.message : "Unknown parsing error"
      },
      { status: 502 }
    );
  }

  const title = String(parsed.title ?? "Untitled");
  const slug =
    title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
  const statement = String(parsed.statement ?? "");
  const constraints = parsed.constraints != null ? String(parsed.constraints) : null;
  const inputFormat = parsed.input_format != null ? String(parsed.input_format) : null;
  const outputFormat = parsed.output_format != null ? String(parsed.output_format) : null;
  const difficulty = Math.min(3, Math.max(1, Number(parsed.difficulty) || 1));
  const sampleInputs = Array.isArray(parsed.sample_inputs) ? parsed.sample_inputs as string[] : [];
  const sampleOutputs = Array.isArray(parsed.sample_outputs) ? parsed.sample_outputs as string[] : [];
  const hiddenInputs = Array.isArray(parsed.hidden_inputs) ? parsed.hidden_inputs as string[] : [];
  const hiddenOutputs = Array.isArray(parsed.hidden_outputs) ? parsed.hidden_outputs as string[] : [];

  const [problem] = await db
    .insert(problems)
    .values({
      title,
      slug,
      statement,
      constraints,
      inputFormat,
      outputFormat,
      source: "ai_generated",
      difficulty,
      topic,
    })
    .returning();

  if (!problem) return NextResponse.json({ error: "Failed to create problem" }, { status: 500 });

  for (let i = 0; i < sampleInputs.length; i++) {
    await db.insert(testCases).values({
      problemId: problem.id,
      input: sampleInputs[i] ?? "",
      expectedOutput: sampleOutputs[i] ?? "",
      isSample: true,
    });
  }
  for (let i = 0; i < hiddenInputs.length; i++) {
    await db.insert(testCases).values({
      problemId: problem.id,
      input: hiddenInputs[i] ?? "",
      expectedOutput: hiddenOutputs[i] ?? "",
      isSample: false,
    });
  }

  await db.insert(aiGeneratedQuestions).values({
    problemId: problem.id,
    level,
    companyType,
    topic,
    promptUsed: system + "\n\n" + userPrompt,
  });

  return NextResponse.json({ problemId: problem.id, title, difficulty, topic });
}
