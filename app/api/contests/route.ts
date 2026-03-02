import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { contests, contestProblems, problems } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET() {
  await getOrCreateUser();
  const list = await db
    .select()
    .from(contests)
    .orderBy(desc(contests.createdAt))
    .limit(50);
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: string; startsAt?: string; endsAt?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { title, startsAt, endsAt } = body;
  if (!title || !startsAt || !endsAt) {
    return NextResponse.json(
      { error: "title, startsAt, and endsAt are required" },
      { status: 400 }
    );
  }

  const slug =
    title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") + "-" + Date.now();

  const [contest] = await db
    .insert(contests)
    .values({
      title,
      slug,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    })
    .returning();

  if (!contest) {
    return NextResponse.json({ error: "Failed to create contest" }, { status: 500 });
  }

  // Auto-assign up to 3 random problems to the contest
  const randomProblems = await db
    .select()
    .from(problems)
    .orderBy(sql`RANDOM()`)
    .limit(3);

  for (let i = 0; i < randomProblems.length; i++) {
    await db.insert(contestProblems).values({
      contestId: contest.id,
      problemId: randomProblems[i].id,
      order: i + 1,
    });
  }

  return NextResponse.json(contest);
}
