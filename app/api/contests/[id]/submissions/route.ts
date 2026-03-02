import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: contestId } = await params;

  const rows = await db
    .select({
      id: submissions.id,
      problemId: submissions.problemId,
      status: submissions.status,
      language: submissions.language,
      submittedAt: submissions.submittedAt,
      runResult: submissions.runResult,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.contestId, contestId),
        eq(submissions.userId, user.id)
      )
    )
    .orderBy(desc(submissions.submittedAt));

  // Group by problemId
  const grouped: Record<
    string,
    Array<{
      id: string;
      problemId: string;
      status: string;
      language: string;
      submittedAt: Date;
      runResult: unknown;
    }>
  > = {};

  for (const row of rows) {
    if (!grouped[row.problemId]) grouped[row.problemId] = [];
    grouped[row.problemId].push(row);
  }

  return NextResponse.json(grouped);
}
