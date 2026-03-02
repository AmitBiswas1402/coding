"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ContestTimer } from "@/components/contest/ContestTimer";
import { RankingBoard, type RankingEntry } from "@/components/contest/RankingBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { LanguageSelector } from "@/components/editor/LanguageSelector";
import { useContestStore } from "@/stores/contest-store";

type ContestProblem = {
  id: string;
  title: string;
  statement: string;
  constraints: string | null;
  inputFormat: string | null;
  outputFormat: string | null;
  difficulty: number;
  topic: string | null;
  order: number;
};

const DEFAULT_CODE: Record<string, string> = {
  python: "# Write your code here\n",
  javascript: "// Write your code here\n",
  typescript: "// Write your code here\n",
  java: "// Write your code here\n",
  cpp: "// Write your code here\n",
  c: "// Write your code here\n",
  csharp: "// Write your code here\n",
  go: "// Write your code here\n",
  rust: "// Write your code here\n",
  ruby: "# Write your code here\n",
  php: "<?php\n// Write your code here\n",
  swift: "// Write your code here\n",
};

export default function ContestPage() {
  const params = useParams();
  const contestId = params.contestId as string;
  const { setContest, setRankings, setEndsAt, markSolved, userSubmissionStatus, reset } = useContestStore();

  const [loading, setLoading] = useState(true);
  const [contest, setContestData] = useState<{
    title: string;
    endsAt: string;
    startsAt: string;
    problems: ContestProblem[];
    rankings: RankingEntry[];
  } | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<ContestProblem | null>(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULT_CODE["python"]);
  const [running, setRunning] = useState(false);
  const [joined, setJoined] = useState(false);

  const fetchContest = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}`);
      if (!res.ok) throw new Error("Failed to load contest");
      const data = await res.json();
      setContestData(data);
      setContest(
        contestId,
        (data.problems ?? []).map((p: ContestProblem) => ({ id: p.id, title: p.title, order: p.order })),
        data.endsAt
      );
      setRankings(data.rankings ?? []);
      if (data.problems?.length > 0) {
        setSelectedProblem(data.problems[0]);
      }
    } catch {
      toast.error("Failed to load contest");
    } finally {
      setLoading(false);
    }
  }, [contestId, setContest, setRankings]);

  useEffect(() => {
    fetchContest();
    return () => reset();
  }, [fetchContest, reset]);

  const handleJoin = async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}/join`, { method: "POST" });
      if (res.ok) {
        setJoined(true);
        toast.success("Joined contest!");
      } else {
        const data = await res.json();
        if (data.error === "Already joined") {
          setJoined(true);
        } else {
          toast.error(data.error ?? "Failed to join");
        }
      }
    } catch {
      toast.error("Failed to join contest");
    }
  };

  const handleRun = async () => {
    if (!selectedProblem) return;
    setRunning(true);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: selectedProblem.id, code, language }),
      });
      const data = await res.json();
      toast(data.message ?? "Run completed");
    } catch {
      toast.error("Run failed");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    setRunning(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          code,
          language,
          contestId,
        }),
      });
      const data = await res.json();
      if (data.status === "accepted") {
        markSolved(selectedProblem.id);
        toast.success("Accepted!");
      } else {
        toast(data.message ?? "Submitted");
      }
      // Refresh rankings
      fetchContest();
    } catch {
      toast.error("Submit failed");
    } finally {
      setRunning(false);
    }
  };

  const handleTimeUp = () => {
    toast("Contest ended! Auto-submitting…");
    if (selectedProblem && code.trim()) {
      handleSubmit();
    }
  };

  if (loading) return <div className="p-8">Loading contest…</div>;
  if (!contest) return <div className="p-8 text-destructive">Contest not found.</div>;

  const isEnded = new Date(contest.endsAt).getTime() < Date.now();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{contest.title}</h1>
        {!joined && !isEnded && (
          <Button onClick={handleJoin}>Join Contest</Button>
        )}
      </div>

      <div className="flex justify-center">
        <ContestTimer contestId={contestId} endsAt={contest.endsAt} onEnd={handleTimeUp} />
      </div>

      {/* Problem tabs */}
      <div className="flex gap-2 border-b pb-2">
        {contest.problems.map((p) => (
          <Button
            key={p.id}
            variant={selectedProblem?.id === p.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedProblem(p);
              setCode(DEFAULT_CODE[language] ?? "// Write your code here\n");
            }}
          >
            {p.order}. {p.title}
            {userSubmissionStatus[p.id] === "accepted" && " ✓"}
          </Button>
        ))}
      </div>

      {selectedProblem && (
        <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">
          {/* Problem statement */}
          <div className="lg:w-1/2 overflow-auto border rounded-lg bg-card p-4">
            <h2 className="text-lg font-semibold mb-2">{selectedProblem.title}</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: selectedProblem.statement }} />
            </div>
            {selectedProblem.constraints && (
              <div className="mt-4">
                <h3 className="font-medium text-sm">Constraints</h3>
                <pre className="text-xs whitespace-pre-wrap mt-1">{selectedProblem.constraints}</pre>
              </div>
            )}
            {selectedProblem.inputFormat && (
              <div className="mt-4">
                <h3 className="font-medium text-sm">Input Format</h3>
                <pre className="text-xs whitespace-pre-wrap mt-1">{selectedProblem.inputFormat}</pre>
              </div>
            )}
            {selectedProblem.outputFormat && (
              <div className="mt-4">
                <h3 className="font-medium text-sm">Output Format</h3>
                <pre className="text-xs whitespace-pre-wrap mt-1">{selectedProblem.outputFormat}</pre>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="lg:w-1/2 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <LanguageSelector
                value={language}
                onChange={(lang) => {
                  setLanguage(lang);
                  if (!code.trim() || code === DEFAULT_CODE[language]) {
                    setCode(DEFAULT_CODE[lang] ?? "// Write your code here\n");
                  }
                }}
                disabled={isEnded}
              />
              <Button size="sm" onClick={handleRun} disabled={running || isEnded}>
                {running ? "Running…" : "Run"}
              </Button>
              <Button size="sm" variant="secondary" onClick={handleSubmit} disabled={running || isEnded}>
                Submit
              </Button>
            </div>
            <div className="flex-1 min-h-[350px] border rounded-lg overflow-hidden">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                height="100%"
                readOnly={isEnded}
              />
            </div>
          </div>
        </div>
      )}

      {contest.problems.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No problems assigned to this contest yet.</p>
          </CardContent>
        </Card>
      )}

      <RankingBoard contestId={contestId} rankings={contest.rankings} />
    </div>
  );
}
