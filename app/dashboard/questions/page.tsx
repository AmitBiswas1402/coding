"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shuffle, Lock } from "lucide-react";
import { ProblemsSidebar } from "@/components/layout/ProblemsSidebar";
import { ProblemsRightSidebar } from "@/components/problems/ProblemsRightSidebar";
import { FeaturedChallenges } from "@/components/problems/FeaturedChallenges";
import { ProblemTopics } from "@/components/problems/ProblemTopics";
import { ProblemSearch } from "@/components/problems/ProblemSearch";
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

export default function QuestionsListPage() {
  const searchParams = useSearchParams();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(
    searchParams.get("topic") || null
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [problemStats, setProblemStats] = useState({
    totalProblems: 0,
    solvedProblems: 0,
  });
  const [submissionsByDay, setSubmissionsByDay] = useState<
    { date: string; count: number }[]
  >([]);
  const [companies, setCompanies] = useState<{ name: string; count: number }[]>([]);

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

  // Fetch problem stats
  useEffect(() => {
    fetch("/api/problems/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.totalProblems !== undefined) {
          setProblemStats({
            totalProblems: data.totalProblems || 0,
            solvedProblems: data.solvedProblems || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch submissions for calendar
  useEffect(() => {
    fetch("/api/analytics/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.submissionsByDay) {
          setSubmissionsByDay(data.submissionsByDay || []);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch companies
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => setCompanies(data || []))
      .catch(() => setCompanies([]));
  }, []);

  async function handleGenerate() {
    setGenLoading(true);
    try {
      const res = await fetch("/api/ai/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "SDE-1",
          companyType: "MNCs",
          topic: selectedTopic || "Arrays",
          sourceStyle: "LeetCode",
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to generate question.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        alert(errorMessage);
        return;
      }
      
      const data = await res.json();
      if (data.problemId) {
        // Refresh problems list
        window.location.reload();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error("Generate question error:", e);
      alert(e instanceof Error ? e.message : "Failed to generate question.");
    } finally {
      setGenLoading(false);
    }
  }

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

  function renderDifficultyPill(value: number) {
    const label = value === 1 ? "Easy" : value === 2 ? "Medium" : "Hard";
    const color =
      value === 1
        ? "text-emerald-400"
        : value === 2
        ? "text-amber-300"
        : "text-rose-400";
    return <span className={color}>{label}</span>;
  }

  function handleShuffle() {
    if (filteredProblems.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredProblems.length);
      const randomProblem = filteredProblems[randomIndex];
      window.location.href = `/dashboard/questions/${randomProblem.id}`;
    }
  }

  const categoryFilters = [
    { id: "all", label: "All Topics" },
    { id: "algorithms", label: "Algorithms" },
    { id: "database", label: "Database" },
    { id: "shell", label: "Shell" },
    { id: "concurrency", label: "Concurrency" },
    { id: "java", label: "Java" },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left Sidebar */}
      <ProblemsSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Featured Challenges */}
          <FeaturedChallenges />

          {/* Problem Topics - Always show, even if empty */}
          <ProblemTopics
            topics={topics}
            selectedTopic={selectedTopic || undefined}
            onTopicSelect={(topic) => setSelectedTopic(topic)}
          />

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {categoryFilters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  categoryFilter === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.label}
                {cat.id === "java" && <span className="ml-1">{"»"}</span>}
              </button>
            ))}
          </div>

          {/* Search and Stats Bar */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex-1">
              <ProblemSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search questions"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {problemStats.solvedProblems}/{problemStats.totalProblems} Solved
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShuffle}
                className="h-9"
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
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Problem List - Always visible */}
          <Card className="bg-[#1a1a1a] border border-[#2d2d2d]">
            <CardContent className="p-0 bg-[#1a1a1a]">
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
                  <p className="text-xs text-muted-foreground mt-1">Total problems in database: {problems.length}</p>
                </div>
              )}
              {!loading && filteredProblems.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="grid grid-cols-[60px,1fr,100px,100px,60px] border-b border-[#2d2d2d] bg-[#1f1f1f] px-4 py-2 text-xs font-medium text-muted-foreground">
                      <span>#</span>
                      <span>Title</span>
                      <span>Success Rate</span>
                      <span>Difficulty</span>
                      <span></span>
                    </div>
                    {/* Rows */}
                    {filteredProblems.map((p, index) => (
                      <Link
                        key={p.id}
                        href={`/dashboard/questions/${p.id}`}
                        className="grid grid-cols-[60px,1fr,100px,100px,60px] items-center border-b border-[#2d2d2d] px-4 py-3 text-sm hover:bg-[#1f1f1f] transition-colors group"
                      >
                        <span className="text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="truncate font-medium text-foreground group-hover:text-primary">
                          {p.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.successRate !== undefined && p.successRate > 0
                            ? `${p.successRate}%`
                            : "—"}
                        </span>
                        <span className="text-xs font-medium">
                          {renderDifficultyPill(p.difficulty)}
                        </span>
                        <div className="flex justify-end">
                          {/* Lock icon for premium problems - can be added later */}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate AI Question Card (Collapsible) */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Generate AI Question</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Topic
                </label>
                <Input
                  placeholder="e.g. Arrays"
                  value={selectedTopic || ""}
                  onChange={(e) => setSelectedTopic(e.target.value || null)}
                  className="w-40"
                />
              </div>
              <Button onClick={handleGenerate} disabled={genLoading}>
                {genLoading ? "Generating…" : "Generate"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar */}
      <ProblemsRightSidebar
        submissionsByDay={submissionsByDay}
        companies={companies}
      />
    </div>
  );
}
