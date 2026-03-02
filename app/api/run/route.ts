import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { testCases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { mockRun } from "@/lib/sandbox/mock";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { 
    problemId?: string; 
    code?: string; 
    language?: string;
    customTestCase?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { problemId, code, language, customTestCase } = body;
  if (!problemId || !code || !language) {
    return NextResponse.json(
      { error: "problemId, code, and language required" },
      { status: 400 }
    );
  }

  let inputs: string[] = [];
  let expectedOutputs: string[] = [];

  if (customTestCase && customTestCase.trim()) {
    // Use custom test case
    inputs = [customTestCase];
    // For custom test cases, we'll need to compute expected output or use mock
    // For now, we'll use a placeholder
    expectedOutputs = [""];
  } else {
    // Fetch sample test cases
    const samples = await db
      .select()
      .from(testCases)
      .where(and(eq(testCases.problemId, problemId), eq(testCases.isSample, true)));
    
    inputs = samples.map((s) => s.input);
    expectedOutputs = samples.map((s) => s.expectedOutput);
  }

  const result = mockRun(code, language, inputs, expectedOutputs);

  return NextResponse.json({
    ok: true,
    accepted: result.passed === result.total,
    message: result.passed === result.total
      ? `All ${result.total} test${result.total === 1 ? "" : "s"} passed`
      : `${result.passed}/${result.total} test${result.total === 1 ? "" : "s"} passed`,
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
