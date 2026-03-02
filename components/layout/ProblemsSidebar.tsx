"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Trophy, GraduationCap, List, Heart, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const sidebarItems = [
  { href: "/dashboard/questions", label: "Library", icon: BookOpen },
  { href: "/dashboard/questions?filter=quest", label: "Quest", icon: Trophy, badge: "New" },
  { href: "/dashboard/practice", label: "Study Plan", icon: GraduationCap },
  { href: "/dashboard/questions?list=my", label: "My Lists", icon: List, hasAdd: true },
  { href: "/dashboard/questions?filter=favorite", label: "Favorite", icon: Heart, isPremium: true },
] as const;

export function ProblemsSidebar() {
  const pathname = usePathname();
  const [showAddList, setShowAddList] = useState(false);

  return (
    <aside className="hidden lg:block w-60 border-r bg-background/50">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        <nav className="p-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href);
            
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.isPremium ? "#" : item.href}
                  onClick={(e) => {
                    if (item.isPremium) {
                      e.preventDefault();
                      // Could show premium modal here
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    active
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-primary text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                  {item.hasAdd && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddList(!showAddList);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-accent rounded"
                      aria-label="Add list"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {item.isPremium && (
                    <Lock className="h-3.5 w-3.5 opacity-50" />
                  )}
                </Link>
                {item.hasAdd && showAddList && (
                  <div className="absolute left-full ml-2 top-0 z-10 w-48 rounded-md border bg-popover p-2 shadow-md">
                    <input
                      type="text"
                      placeholder="List name..."
                      className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
                      autoFocus
                      onBlur={() => setShowAddList(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          // Handle list creation
                          setShowAddList(false);
                        } else if (e.key === "Escape") {
                          setShowAddList(false);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
