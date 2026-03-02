import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const problemId = id;
  if (!problemId) {
    return NextResponse.json({ error: "Problem ID required" }, { status: 400 });
  }

  try {
    const userSubmissions = await db
      .select({
        id: submissions.id,
        status: submissions.status,
        language: submissions.language,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .where(and(
        eq(submissions.problemId, problemId),
        eq(submissions.userId, user.id)
      ))
      .orderBy(desc(submissions.createdAt))
      .limit(50);

    return NextResponse.json(userSubmissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
