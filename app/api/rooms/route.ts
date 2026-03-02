import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateRoomCode } from "@/lib/utils";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { difficulty?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const difficulty = Math.min(3, Math.max(1, body.difficulty ?? 1));

  let code = generateRoomCode();
  const [existing] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  if (existing) code = generateRoomCode();

  const [room] = await db
    .insert(rooms)
    .values({
      code,
      createdBy: user.id,
      difficulty,
    })
    .returning();

  if (!room) return NextResponse.json({ error: "Failed to create room" }, { status: 500 });

  return NextResponse.json({ roomId: room.id, roomCode: room.code });
}

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await db
    .select()
    .from(rooms)
    .where(eq(rooms.createdBy, user.id))
    .orderBy(desc(rooms.createdAt))
    .limit(20);

  return NextResponse.json(list);
}
