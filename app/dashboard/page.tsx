"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Code2,
  Brain,
  BarChart3,
  Zap,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProblemTopics } from "@/components/problems/ProblemTopics";
import { cn } from "@/lib/utils";

type Problem = {
  id: string;
  title: string;
  difficulty: number;
  topic: string | null;
  successRate?: number;
};

type Topic = {
  name: string;
  count: number;
};

const navItems = [
  {
    href: "/dashboard/race/create",
    label: "Coding Room",
    icon: Zap,
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
  },
  {
    href: "/dashboard/contest",
    label: "Contests",
    icon: Trophy,
    gradient: "from-purple-400 via-pink-500 to-rose-600",
  },
  {
    href: "/dashboard/interview",
    label: "AI Interview",
    icon: Brain,
    gradient: "from-orange-400 via-red-500 to-pink-600",
  },
  {
    href: "/dashboard/questions",
    label: "Problems",
    icon: Code2,
    gradient: "from-yellow-400 via-amber-500 to-orange-600",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    gradient: "from-indigo-400 via-purple-500 to-violet-600",
  },
];

export default function DashboardPage() {
  const pathname = usePathname();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");

  // Fetch problems
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedTopic) params.set("topic", selectedTopic);
    if (difficultyFilter !== "all") {
      params.set("difficulty", difficultyFilter === "easy" ? "1" : difficultyFilter === "medium" ? "2" : "3");
    }
    if (searchQuery) params.set("search", searchQuery);

    fetch(`/api/problems?${params.toString()}&limit=500`)
      .then((r) => {
        if (!r.ok) {
          console.error("Failed to fetch problems:", r.status);
          return [];
        }
        return r.json();
      })
      .then((data) => {
        const problemsList = Array.isArray(data) ? data : [];
        console.log("Fetched problems:", problemsList.length);
        setProblems(problemsList);
      })
      .catch((error) => {
        console.error("Error fetching problems:", error);
        setProblems([]);
      })
      .finally(() => setLoading(false));
  }, [selectedTopic, difficultyFilter, searchQuery]);

  // Fetch topics
  useEffect(() => {
    fetch("/api/problems/topics")
      .then((r) => {
        if (!r.ok) {
          console.error("Failed to fetch topics:", r.status);
          return [];
        }
        return r.json();
      })
      .then((data) => setTopics(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Error fetching topics:", error);
        setTopics([]);
      });
  }, []);

  const filteredProblems = useMemo(() => {
    let filtered = problems;
    if (difficultyFilter !== "all") {
      const target =
        difficultyFilter === "easy" ? 1 : difficultyFilter === "medium" ? 2 : 3;
      filtered = filtered.filter((p) => p.difficulty === target);
    }
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [problems, difficultyFilter, searchQuery]);

  function handleShuffle() {
    if (filteredProblems.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredProblems.length);
      const randomProblem = filteredProblems[randomIndex];
      window.location.href = `/dashboard/questions/${randomProblem.id}`;
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-6 py-8 bg-[#1a1a1a]">
      <div className="w-full max-w-7xl mx-auto">
        {/* Feature Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-[#2d2d2d] transition-all duration-300",
                  "hover:scale-105 hover:shadow-2xl hover:shadow-black/30",
                  isActive && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {/* Gradient Background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-95 group-hover:opacity-100 transition-opacity",
                  item.gradient
                )} />
                
                {/* Pattern Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
                
                {/* Content */}
                <div className="relative z-10 p-8 flex flex-col items-center text-center min-h-[180px] justify-center">
                  <div className="rounded-xl bg-white/25 p-4 backdrop-blur-sm mb-4 shadow-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {item.label}
                  </h3>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>

        {/* Problems Section */}
        <div className="space-y-4">
          {/* Topic Filters */}
          <ProblemTopics
            topics={topics}
            selectedTopic={selectedTopic || undefined}
            onTopicSelect={(topic) => setSelectedTopic(topic)}
          />

          {/* Search and Filters */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1f1f1f] border-[#2d2d2d] text-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShuffle}
                className="h-9 border-[#2d2d2d]"
                title="Shuffle problems"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Difficulty Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
            <span className="text-muted-foreground mr-1">Difficulty:</span>
            {[
              { id: "all", label: "All" },
              { id: "easy", label: "Easy" },
              { id: "medium", label: "Medium" },
              { id: "hard", label: "Hard" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  setDifficultyFilter(opt.id as typeof difficultyFilter)
                }
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  difficultyFilter === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted/70 border border-[#2d2d2d]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Problem List - LeetCode Style */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg overflow-hidden">
            {loading && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading problems…
              </div>
            )}
            {!loading && filteredProblems.length === 0 && problems.length === 0 && (
              <div className="p-8 text-center text-sm text-foreground">
                <p className="mb-2">No problems found.</p>
                <p className="text-xs text-muted-foreground">
                  Run <code className="px-1 py-0.5 bg-muted rounded text-foreground">npm run seed:leetcode</code> to seed problems.
                </p>
              </div>
            )}
            {!loading && filteredProblems.length === 0 && problems.length > 0 && (
              <div className="p-8 text-center text-sm text-foreground">
                <p>No problems match your filters.</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
              {!loading && filteredProblems.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    {/* Rows - LeetCode Style */}
                    {filteredProblems.map((p, index) => (
                      <Link
                        key={p.id}
                        href={`/dashboard/questions/${p.id}`}
                        className="flex items-center gap-4 px-4 py-2.5 border-b border-[#2d2d2d] hover:bg-[#1f1f1f] transition-colors group"
                      >
                        {/* Problem Number and Title */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <span className="text-sm text-muted-foreground font-medium w-12 flex-shrink-0">
                            {index + 1}.
                          </span>
                          <span className="text-sm text-foreground group-hover:text-blue-400 transition-colors truncate">
                            {p.title}
                          </span>
                        </div>
                        
                        {/* Acceptance Rate */}
                        <div className="text-sm text-muted-foreground w-20 text-right flex-shrink-0">
                          {p.successRate !== undefined && p.successRate > 0
                            ? `${p.successRate.toFixed(1)}%`
                            : "—"}
                        </div>
                        
                        {/* Difficulty Badge */}
                        <div className="w-16 flex-shrink-0">
                          {p.difficulty === 1 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Easy
                            </span>
                          ) : p.difficulty === 2 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Med.
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Hard
                            </span>
                          )}
                        </div>
                        
                        {/* Lock/Star Icon Placeholder */}
                        <div className="w-6 flex-shrink-0 flex justify-end">
                          {/* Can add lock or star icon here */}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
