import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getOrCreateUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const [existing] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? undefined;
  const name = clerkUser
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || undefined
    : undefined;
  const imageUrl = clerkUser?.imageUrl ?? undefined;
  const [inserted] = await db
    .insert(users)
    .values({
      clerkId,
      email,
      name,
      avatarUrl: imageUrl,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email, name, avatarUrl: imageUrl },
    })
    .returning();
  return inserted ?? null;
}

