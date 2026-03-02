"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#2d2d2d] bg-[#1a1a1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a1a1a]/95">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            Coding Arena
          </span>
        </Link>

        {/* User Profile */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
