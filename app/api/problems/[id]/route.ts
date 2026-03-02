import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { problems, testCases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await getOrCreateUser();
  const { id } = await params;
  const [problem] = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cases = await db
    .select()
    .from(testCases)
    .where(eq(testCases.problemId, id));
  const sampleCases = cases.filter((c) => c.isSample);

  return NextResponse.json({
    ...problem,
    testCases: cases,
    sampleTestCases: sampleCases,
  });
}
