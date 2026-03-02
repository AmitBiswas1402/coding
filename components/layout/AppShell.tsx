"use client";

import type React from "react";
import { TopNav } from "./TopNav";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProblemsPage = pathname?.startsWith("/dashboard/questions");

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-foreground">
      <TopNav />
      {isProblemsPage ? (
        <main className="h-[calc(100vh-3.5rem)]">{children}</main>
      ) : (
        <main className="h-[calc(100vh-3.5rem)]">{children}</main>
      )}
    </div>
  );
}

