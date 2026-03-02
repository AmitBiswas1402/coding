import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms, roomParticipants, users, problems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const participants = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(roomParticipants)
    .innerJoin(users, eq(roomParticipants.userId, users.id))
    .where(eq(roomParticipants.roomId, roomId));

  let problem: typeof problems.$inferSelect | null = null;
  if (room.problemId) {
    const [p] = await db.select().from(problems).where(eq(problems.id, room.problemId)).limit(1);
    problem = p ?? null;
  }

  return NextResponse.json({
    roomId: room.id,
    roomCode: room.code,
    status: room.status,
    difficulty: room.difficulty,
    startedAt: room.startedAt,
    endsAt: room.endsAt,
    createdBy: room.createdBy,
    isHost: room.createdBy === user.id,
    participants,
    problem,
  });
}
