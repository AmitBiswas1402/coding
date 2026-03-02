import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms, problems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const DURATION_MS = {
  1: 30 * 60 * 1000,
  2: 45 * 60 * 1000,
  3: 60 * 60 * 1000,
} as const;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.createdBy !== user.id) return NextResponse.json({ error: "Only host can start" }, { status: 403 });
  if (room.status !== "waiting") return NextResponse.json({ error: "Race already started" }, { status: 400 });

  const difficulty = Math.min(3, Math.max(1, room.difficulty));
  const [problem] = await db
    .select()
    .from(problems)
    .where(eq(problems.difficulty, difficulty))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const startedAt = new Date();
  const durationMs = DURATION_MS[difficulty as keyof typeof DURATION_MS] ?? DURATION_MS[1];
  const endsAt = new Date(startedAt.getTime() + durationMs);

  await db
    .update(rooms)
    .set({
      status: "running",
      startedAt,
      endsAt,
      problemId: problem?.id ?? null,
    })
    .where(eq(rooms.id, roomId));

  return NextResponse.json({
    problem: problem
      ? {
          id: problem.id,
          title: problem.title,
          statement: problem.statement,
          constraints: problem.constraints,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          difficulty: problem.difficulty,
          topic: problem.topic,
        }
      : null,
    difficulty,
    endsAt: endsAt.toISOString(),
  });
}
