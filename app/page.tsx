import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            Realtime Coding Arena
          </Link>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium hover:underline">
                  Sign in
                </button>
              </SignInButton>
              <Link
                href="/sign-up"
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Get started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:underline"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Realtime Coding Arena + AI Interview Platform
          </h1>
          <p className="text-muted-foreground mb-8">
            Race with friends, practice with AI, and level up your coding
            skills. Join rooms, solve problems, and climb the leaderboard.
          </p>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90"
            >
              Go to Dashboard
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-up"
              className="inline-flex rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90"
            >
              Get started
            </Link>
          </SignedOut>
        </div>
      </main>
    </div>
  );
}
