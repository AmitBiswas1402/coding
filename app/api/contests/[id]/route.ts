import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { contests, contestProblems, contestScores, problems, users } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await getOrCreateUser();
  const { id } = await params;
  const [contest] = await db.select().from(contests).where(eq(contests.id, id)).limit(1);
  if (!contest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cp = await db
    .select({ problemId: contestProblems.problemId, order: contestProblems.order })
    .from(contestProblems)
    .where(eq(contestProblems.contestId, id));
  const problemIds = cp.map((r) => r.problemId);
  const problemList =
    problemIds.length > 0
      ? await db.select().from(problems).where(inArray(problems.id, problemIds))
      : [];
  const problemMap = new Map(problemList.map((p) => [p.id, p]));
  const problemsWithOrder = cp
    .map((c) => {
      const p = problemMap.get(c.problemId);
      return p ? { ...p, order: c.order } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a as { order: number }).order - (b as { order: number }).order);

  // Compute rankings from contest_scores
  const scores = await db
    .select({
      userId: contestScores.userId,
      userName: users.name,
      totalScore: sql<number>`SUM(${contestScores.score})`.as("total_score"),
      solvedCount: sql<number>`COUNT(${contestScores.id})`.as("solved_count"),
    })
    .from(contestScores)
    .innerJoin(users, eq(contestScores.userId, users.id))
    .where(eq(contestScores.contestId, id))
    .groupBy(contestScores.userId, users.name)
    .orderBy(sql`SUM(${contestScores.score}) DESC`);

  const rankings = scores.map((s, i) => ({
    rank: i + 1,
    userId: s.userId,
    userName: s.userName ?? "User",
    score: Number(s.totalScore),
    solvedCount: Number(s.solvedCount),
  }));

  return NextResponse.json({
    ...contest,
    problems: problemsWithOrder,
    rankings,
  });
}
