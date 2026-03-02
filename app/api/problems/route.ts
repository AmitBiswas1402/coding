import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { problems, submissions } from "@/lib/db/schema";
import { eq, desc, and, sql, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  // Don't require auth for viewing problems
  try {
    await getOrCreateUser();
  } catch {
    // Continue even if auth fails
  }
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");
  const limit = Math.min(500, parseInt(searchParams.get("limit") ?? "500", 10) || 500);

  const conditions = [];
  if (topic) conditions.push(eq(problems.topic, topic));
  if (difficulty) conditions.push(eq(problems.difficulty, parseInt(difficulty, 10)));
  if (search) {
    conditions.push(ilike(problems.title, `%${search}%`));
  }

  // Get problems - simplified query
  let baseQuery = db.select({
    id: problems.id,
    title: problems.title,
    slug: problems.slug,
    statement: problems.statement,
    constraints: problems.constraints,
    inputFormat: problems.inputFormat,
    outputFormat: problems.outputFormat,
    source: problems.source,
    difficulty: problems.difficulty,
    topic: problems.topic,
    createdAt: problems.createdAt,
  }).from(problems);

  if (conditions.length > 0) {
    baseQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
  }

  const list = await baseQuery
    .orderBy(problems.title)
    .limit(limit);

  // Return problems with optional success rate (can be calculated later if needed)
  const problemsWithStats = list.map((p) => ({
    ...p,
    successRate: undefined, // Will be calculated on demand if needed
  }));

  return NextResponse.json(problemsWithStats);
}

// New endpoint for topic aggregation
export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Get topic counts
  const topicCounts = await db
    .select({
      topic: problems.topic,
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(problems)
    .where(sql`${problems.topic} IS NOT NULL`)
    .groupBy(problems.topic)
    .orderBy(desc(sql`COUNT(*)`));

  return NextResponse.json(topicCounts);
}
