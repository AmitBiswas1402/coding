import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { problems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildCodeAnalysisPrompt } from "@/lib/ai/prompts/code-analysis";
import { chatCompletion, getModelForUseCase } from "@/lib/ai/client";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { code?: string; problemId?: string; language?: string } = {};
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
  const { code, problemId, language = "python" } = body;
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  let problemTitle = "Coding problem";
  if (problemId) {
    const [p] = await db.select().from(problems).where(eq(problems.id, problemId)).limit(1);
    if (p) problemTitle = p.title;
  }

  const { system, user: userPrompt } = buildCodeAnalysisPrompt(code, problemTitle, language);
  try {
    const feedback = await chatCompletion(system, userPrompt, {
      model: getModelForUseCase("codeAnalysis"),
      maxTokens: 1024,
      temperature: 0.3,
    });
    return NextResponse.json({ feedback });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 502 }
    );
  }
}
