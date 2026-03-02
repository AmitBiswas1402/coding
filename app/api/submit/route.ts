import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, testCases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { mockRun } from "@/lib/sandbox/mock";

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
