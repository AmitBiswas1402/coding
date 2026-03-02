import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { interviewSessions, interviewResults } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const session = await db
    .select()
    .from(interviewSessions)
    .where(and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, user.id)))
    .limit(1);

  if (!session.length) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const s = session[0];

  // Calculate remaining time & check expiry
  const now = new Date();
  const endsAt = new Date(s.startedAt!.getTime() + s.expectedTimeMinutes * 60 * 1000);
  const isExpired = now > endsAt && s.status === "active";

  // Auto-expire if needed
  if (isExpired) {
    await db
      .update(interviewSessions)
      .set({ status: "expired", completedAt: endsAt })
      .where(eq(interviewSessions.id, sessionId));
    s.status = "expired";
    s.completedAt = endsAt;
  }

  // Fetch result if completed
  let result = null;
  if (s.status === "completed" || s.status === "expired") {
    const results = await db
      .select()
      .from(interviewResults)
      .where(eq(interviewResults.sessionId, sessionId))
      .limit(1);
    if (results.length) result = results[0];
  }

  return NextResponse.json({
    session: {
      id: s.id,
      level: s.level,
      companyCategory: s.companyCategory,
      topic: s.topic,
      question: s.question,
      expectedTimeMinutes: s.expectedTimeMinutes,
      status: s.status,
      startedAt: s.startedAt?.toISOString(),
      endsAt: endsAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
    },
    result: result
      ? {
          id: result.id,
          code: result.code,
          language: result.language,
          solveTimeMinutes: result.solveTimeMinutes,
          runAttempts: result.runAttempts,
          scores: result.scoresJson,
          hireRecommendation: result.hireRecommendation,
          completedAt: result.completedAt?.toISOString(),
        }
      : null,
  });
}
