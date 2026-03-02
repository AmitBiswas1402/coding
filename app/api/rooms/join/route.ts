import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms, roomParticipants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { roomCode?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const roomCode = (body.roomCode ?? "").trim().toUpperCase();
  if (!roomCode) return NextResponse.json({ error: "Room code required" }, { status: 400 });

  const [room] = await db.select().from(rooms).where(eq(rooms.code, roomCode)).limit(1);
  if (!room) return NextResponse.json({ error: "Invalid room code" }, { status: 404 });

  const count = await db
    .select()
    .from(roomParticipants)
    .where(eq(roomParticipants.roomId, room.id));
  if (count.length >= 4) return NextResponse.json({ error: "Room is full" }, { status: 400 });

  const already = count.find((p) => p.userId === user.id);
  if (!already) {
    await db.insert(roomParticipants).values({
      roomId: room.id,
      userId: user.id,
    });
  }

  return NextResponse.json({ roomId: room.id, roomCode: room.code });
}
