import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms, submissions, problems, roomParticipants, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { chatCompletion, getModelForUseCase } from "@/lib/ai/client";
import {
  buildRaceFeedbackPrompt,
  parseRaceFeedbackResponse,
  type RaceParticipantData,
  type RaceFeedbackInput,
} from "@/lib/ai/prompts/race-feedback";

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { roomId?: string; participantStats?: RaceParticipantData[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const roomId = body.roomId;
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  // Fetch room
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  // Fetch problem
  let problemTitle = "Unknown Problem";
  let problemTopic = "General";
  if (room.problemId) {
    const [prob] = await db.select().from(problems).where(eq(problems.id, room.problemId)).limit(1);
    if (prob) {
      problemTitle = prob.title;
      problemTopic = prob.topic || "General";
    }
  }

  // Fetch room participants from DB
  const dbParticipants = await db
    .select({ id: users.id, name: users.name })
    .from(roomParticipants)
    .innerJoin(users, eq(roomParticipants.userId, users.id))
    .where(eq(roomParticipants.roomId, roomId));

  // Fetch all submissions for this room
  const roomSubmissions = await db
    .select()
    .from(submissions)
    .where(eq(submissions.roomId, roomId));

  // Build participant data — merge client-provided stats with DB data
  const clientStats = body.participantStats || [];
  const participantData: RaceParticipantData[] = dbParticipants.map((p) => {
    const clientEntry = clientStats.find((cs) => cs.userId === p.id);
    const userSubs = roomSubmissions.filter((s) => s.userId === p.id);
    const solved = userSubs.some((s) => s.status === "accepted");
    const solvedSub = userSubs.find((s) => s.status === "accepted");
    const solvedAtMs =
      clientEntry?.solvedAtMs ??
      (solvedSub?.submittedAt
        ? new Date(String(solvedSub.submittedAt)).getTime() -
          (room.startedAt ? new Date(String(room.startedAt)).getTime() : 0)
        : null);

    return {
      userId: p.id,
      userName: p.name || "User",
      solved: clientEntry?.solved ?? solved,
      submissionCount: clientEntry?.submissionCount ?? userSubs.length,
      runCount: clientEntry?.runCount ?? 0,
      solvedAtMs,
      language: clientEntry?.language ?? userSubs[0]?.language,
    };
  });

  // Calculate duration
  const durationMinutes = room.startedAt && room.endsAt
    ? Math.round(
        (new Date(String(room.endsAt)).getTime() -
          new Date(String(room.startedAt)).getTime()) /
          60000
      )
    : 30;

  const input: RaceFeedbackInput = {
    roomId,
    problemTitle,
    problemTopic,
    difficulty: room.difficulty,
    durationMinutes,
    participants: participantData,
  };

  const { system, user: userPrompt } = buildRaceFeedbackPrompt(input);

  try {
    const raw = await chatCompletion(system, userPrompt, {
      model: getModelForUseCase("codeAnalysis"),
      maxTokens: 2000,
      temperature: 0.4,
    });

    const result = parseRaceFeedbackResponse(raw);

    return NextResponse.json({ result, input });
  } catch (err) {
    console.error("Race feedback AI error:", err);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
