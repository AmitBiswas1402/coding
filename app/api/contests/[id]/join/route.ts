import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { contestParticipants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: contestId } = await params;

  const existing = await db
    .select()
    .from(contestParticipants)
    .where(
      and(
        eq(contestParticipants.contestId, contestId),
        eq(contestParticipants.userId, user.id)
      )
    )
    .limit(1);
  if (existing.length > 0) return NextResponse.json({ joined: true });

  await db.insert(contestParticipants).values({
    contestId,
    userId: user.id,
  });
  return NextResponse.json({ joined: true });
}
