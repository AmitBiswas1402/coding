import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { problems } from "@/lib/db/schema";
import { sql, desc, isNotNull } from "drizzle-orm";

export async function GET() {
  // Get topic counts
  const topicCounts = await db
    .select({
      topic: problems.topic,
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(problems)
    .where(isNotNull(problems.topic))
    .groupBy(problems.topic)
    .orderBy(desc(sql`COUNT(*)`));

  return NextResponse.json(
    topicCounts.map((tc) => ({
      name: tc.topic,
      count: Number(tc.count),
    }))
  );
}
