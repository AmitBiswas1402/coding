import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { problems, submissions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    
    // Get total problems count
    const totalProblemsResult = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(problems);
    const totalProblems = Number(totalProblemsResult[0]?.count) || 0;

    let solvedProblems = 0;
    if (user) {
      // Get user's solved problems count (unique problems with accepted submissions)
      const solvedProblemsResult = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${problems.id})::int` })
        .from(problems)
        .innerJoin(submissions, eq(submissions.problemId, problems.id))
        .where(
          sql`${submissions.userId} = ${user.id} AND ${submissions.status} = 'accepted'`
        );
      solvedProblems = Number(solvedProblemsResult[0]?.count) || 0;
    }

    return NextResponse.json({
      totalProblems,
      solvedProblems,
      solvedRatio: totalProblems > 0 ? solvedProblems / totalProblems : 0,
    });
  } catch (error) {
    // Return default stats if there's an error
    const totalProblemsResult = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(problems);
    const totalProblems = Number(totalProblemsResult[0]?.count) || 0;
    
    return NextResponse.json({
      totalProblems,
      solvedProblems: 0,
      solvedRatio: 0,
    });
  }
}
