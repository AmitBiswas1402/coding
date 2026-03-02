import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db
    .select()
    .from(submissions)
    .where(eq(submissions.userId, user.id));

  const accepted = all.filter((s) => s.status === "accepted");
  const problemsSolved = new Set(accepted.map((s) => s.problemId)).size;
  const accuracy = all.length > 0 ? (accepted.length / all.length) * 100 : 0;

  const byDay = new Map<string, number>();
  for (const s of all) {
    const date = s.submittedAt instanceof Date
      ? s.submittedAt.toISOString().slice(0, 10)
      : String(s.submittedAt).slice(0, 10);
    byDay.set(date, (byDay.get(date) ?? 0) + 1);
  }
  const submissionsByDay = Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((byDay.get(key) ?? 0) > 0) streak++;
    else break;
  }

  return NextResponse.json({
    submissionsByDay,
    problemsSolved,
    accuracy: Math.round(accuracy * 10) / 10,
    streak,
    totalSubmissions: all.length,
  });
}
