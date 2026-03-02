"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/race/create", label: "Create Race" },
  { href: "/dashboard/race/join", label: "Join Race" },
  { href: "/dashboard/questions", label: "Problems" },
  { href: "/dashboard/practice", label: "Practice" },
  { href: "/dashboard/contest", label: "Contests" },
  { href: "/dashboard/interview", label: "AI Interview" },
  { href: "/dashboard/analytics", label: "Analytics" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r bg-background/80 lg:block lg:w-56">
      <div className="sticky top-14 flex max-h-[calc(100vh-3.5rem)] flex-col overflow-y-auto px-3 py-4 text-sm">
        <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
          Navigation
        </div>
        <nav className="space-y-1">
          {sidebarLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

