"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ContestTimer } from "@/components/contest/ContestTimer";
import { RankingBoard, type RankingEntry } from "@/components/contest/RankingBoard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { LanguageSelector } from "@/components/editor/LanguageSelector";
import { useContestStore, type ContestTestResult, type ContestSubmission } from "@/stores/contest-store";
import { getGenericTemplate } from "@/lib/code-templates";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Lock,
  Trophy,
} from "lucide-react";

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
  testCases?: { id: string; input: string; expectedOutput: string; isSample: boolean }[];
  sampleTestCases?: { id: string; input: string; expectedOutput: string; isSample: boolean }[];
};

type AiEvaluation = {
  correctness_score: number;
  time_complexity: string;
  space_complexity: string;
  optimization_score: number;
  readability_score: number;
  edge_case_handling_score: number;
  issues: string[];
  improvement_suggestions: string[];
  overall_feedback: string;
};

type LeftTab = "description" | "submissions";
type BottomTab = "testcase" | "result" | "ai-review";

export default function ContestPage() {
  const params = useParams();
  const contestId = params.contestId as string;
  const {
    setContest,
    setRankings,
    markSolved,
    lockContest,
    isLocked,
    currentProblemIndex,
    setCurrentProblem,
    testResult,
    setTestResult,
    userSubmissionStatus,
    submissionsMap,
    addSubmission,
    setSubmissions,
    codeMap,
    setCodeForProblem,
    reset,
  } = useContestStore();

  const [loading, setLoading] = useState(true);
  const [contest, setContestData] = useState<{
    title: string;
    endsAt: string;
    startsAt: string;
    problems: ContestProblem[];
    rankings: RankingEntry[];
    isParticipant?: boolean;
  } | null>(null);
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(getGenericTemplate("java"));
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  // UI state
  const [leftTab, setLeftTab] = useState<LeftTab>("description");
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcase");
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);

  // AI evaluation state
  const [aiEvaluation, setAiEvaluation] = useState<AiEvaluation | null>(null);
  const [aiEvalLoading, setAiEvalLoading] = useState(false);

  const selectedProblem = contest?.problems?.[currentProblemIndex] ?? null;

  // ── Fetch contest data ──
  const fetchContest = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}`);
      if (!res.ok) throw new Error("Failed to load contest");
      const data = await res.json();
      setContestData(data);
      setContest(
        contestId,
        (data.problems ?? []).map((p: ContestProblem) => ({
          id: p.id,
          title: p.title,
          order: p.order,
        })),
        data.endsAt
      );
      setRankings(data.rankings ?? []);
      if (data.isParticipant) setJoined(true);

      // Check if already ended
      if (new Date(data.endsAt).getTime() < Date.now()) {
        lockContest();
      }
    } catch {
      toast.error("Failed to load contest");
    } finally {
      setLoading(false);
    }
  }, [contestId, setContest, setRankings, lockContest]);

  // ── Fetch user submissions for this contest ──
  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}/submissions`);
      if (res.ok) {
        const grouped: Record<string, ContestSubmission[]> = await res.json();
        for (const [problemId, subs] of Object.entries(grouped)) {
          setSubmissions(problemId, subs);
          // Mark solved if any accepted
          if (subs.some((s) => s.status === "accepted")) {
            markSolved(problemId);
          }
        }
      }
    } catch {
      // Non-critical
    }
  }, [contestId, setSubmissions, markSolved]);

  useEffect(() => {
    fetchContest();
    return () => reset();
  }, [fetchContest, reset]);

  useEffect(() => {
    if (joined) fetchSubmissions();
  }, [joined, fetchSubmissions]);

  // ── Restore code when switching problems ──
  useEffect(() => {
    if (!selectedProblem) return;
    const saved = codeMap[selectedProblem.id];
    if (saved) {
      setCode(saved);
    } else {
      const template = getGenericTemplate(language);
      setCode(template);
    }
    setTestResult(null);
    setAiEvaluation(null);
  }, [currentProblemIndex, selectedProblem?.id]);

  // ── Persist code on change ──
  useEffect(() => {
    if (selectedProblem && code) {
      setCodeForProblem(selectedProblem.id, code);
    }
  }, [code]);

  // ── Draggable split pane ──
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
    },
    []
  );
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleMouseDown = useCallback(() => setIsDragging(true), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ── Join contest ──
  const handleJoin = async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}/join`, {
        method: "POST",
      });
      if (res.ok) {
        setJoined(true);
        toast.success("Joined contest!");
      } else {
        const data = await res.json();
        if (data.joined || data.error === "Already joined") {
          setJoined(true);
        } else {
          toast.error(data.error ?? "Failed to join");
        }
      }
    } catch {
      toast.error("Failed to join contest");
    }
  };

  // ── Run code ──
  const handleRun = async () => {
    if (!selectedProblem || isLocked) return;
    setRunning(true);
    setTestResult(null);
    setTimeout(() => setBottomTab("result"), 100);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          code,
          language,
        }),
      });
      const data = await res.json();
      setTestResult(
        data.runResult ?? { passed: 0, total: 0 }
      );
      if (data.accepted) {
        toast.success(data.message || "All test cases passed!");
      } else {
        toast.error(data.message || "Some test cases failed");
      }
    } catch {
      toast.error("Run failed");
      setTestResult({ passed: 0, total: 0, results: [] });
    } finally {
      setRunning(false);
    }
  };

  // ── Submit code ──
  const handleSubmit = async () => {
    if (!selectedProblem || isLocked) return;
    setSubmitting(true);
    setTestResult(null);
    setAiEvaluation(null);
    setTimeout(() => setBottomTab("result"), 100);
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

      // Handle contest ended response
      if (data.locked) {
        lockContest();
        toast.error("Contest has ended!");
        return;
      }

      setTestResult(
        data.runResult ?? { passed: 0, total: 0 }
      );

      if (data.status === "accepted") {
        markSolved(selectedProblem.id);
        toast.success("Accepted!");
      } else {
        toast(data.message ?? "Submitted");
      }

      // Add to local submissions
      if (data.submissionId) {
        addSubmission(selectedProblem.id, {
          id: data.submissionId,
          problemId: selectedProblem.id,
          status: data.status,
          language,
          submittedAt: new Date().toISOString(),
          runResult: data.runResult,
        });

        // Start AI evaluation polling
        pollAiEvaluation(data.submissionId);
      }

      // Refresh rankings after submit
      fetchContest();
    } catch {
      toast.error("Submit failed");
      setTestResult({ passed: 0, total: 0, results: [] });
    } finally {
      setSubmitting(false);
    }
  };

  // ── AI evaluation polling ──
  const pollAiEvaluation = (submissionId: string) => {
    setAiEvalLoading(true);
    setBottomTab("ai-review");
    let attempts = 0;
    const maxAttempts = 15;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(
          `/api/ai/analyze-code?submissionId=${submissionId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "complete" && data.evaluation) {
            setAiEvaluation(data.evaluation);
            setAiEvalLoading(false);
            return;
          }
        }
      } catch {
        // continue
      }
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setAiEvalLoading(false);
      }
    };

    setTimeout(poll, 3000);
  };

  // ── Auto-submit on time up ──
  const handleTimeUp = () => {
    lockContest();
    toast("Contest ended!");
    if (selectedProblem && code.trim() && !isLocked) {
      handleSubmit();
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const template = getGenericTemplate(lang);
    setCode(template);
  };

  // ── Loading / Error states ──
  if (loading) return <div className="p-8 text-foreground">Loading contest…</div>;
  if (!contest) return <div className="p-8 text-destructive">Contest not found.</div>;

  const sampleCases =
    selectedProblem?.testCases?.filter((tc) => tc.isSample) ??
    selectedProblem?.sampleTestCases ??
    [];
  const problemSubmissions = selectedProblem
    ? submissionsMap[selectedProblem.id] ?? []
    : [];

  // ── Locked overlay ──
  if (isLocked && !loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#1a1a1a]">
        {/* Top bar */}
        <div className="border-b border-[#2d2d2d] bg-[#1f1f1f] px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{contest.title}</h1>
          <ContestTimer contestId={contestId} endsAt={contest.endsAt} />
        </div>

        {/* Ended overlay */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-lg w-full border-red-500/30 bg-[#1f1f1f]">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
                <Lock className="h-7 w-7 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Contest Ended</h2>
              <p className="text-muted-foreground text-sm">
                The contest has ended. All submissions are locked.
              </p>

              {/* Inline final rankings */}
              <div className="mt-4">
                <RankingBoard contestId={contestId} rankings={contest.rankings} isActive={false} />
              </div>

              <Button variant="outline" onClick={() => (window.location.href = "/dashboard/contest")}>
                Back to Contests
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Pre-join state ──
  if (!joined) {
    const isUpcoming = new Date(contest.startsAt).getTime() > Date.now();
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#1a1a1a]">
        <div className="border-b border-[#2d2d2d] bg-[#1f1f1f] px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{contest.title}</h1>
          <ContestTimer contestId={contestId} endsAt={contest.endsAt} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full bg-[#1f1f1f] border-[#2d2d2d]">
            <CardContent className="p-8 text-center space-y-4">
              <Trophy className="h-10 w-10 mx-auto text-amber-400" />
              <h2 className="text-xl font-bold text-foreground">{contest.title}</h2>
              <p className="text-sm text-muted-foreground">
                {contest.problems.length} problem{contest.problems.length !== 1 && "s"} ·{" "}
                {isUpcoming ? "Starts soon" : "In progress"}
              </p>
              <Button onClick={handleJoin} size="lg" className="w-full">
                Join Contest
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main contest UI ──
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#1a1a1a]">
      {/* Top Bar: Timer center, problem tabs, Run/Submit */}
      <div className="border-b border-[#2d2d2d] bg-[#1f1f1f] px-4 py-2 flex items-center justify-between gap-4">
        {/* Problem tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {contest.problems.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrentProblem(i)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                currentProblemIndex === i
                  ? "bg-blue-600 text-white"
                  : "text-muted-foreground hover:bg-[#2d2d2d] hover:text-foreground"
              )}
            >
              {p.order}. {p.title}
              {userSubmissionStatus[p.id] === "accepted" && (
                <CheckCircle2 className="inline ml-1 h-3 w-3 text-emerald-400" />
              )}
            </button>
          ))}
        </div>

        {/* Timer */}
        <div className="shrink-0">
          <ContestTimer contestId={contestId} endsAt={contest.endsAt} onEnd={handleTimeUp} />
        </div>

        {/* Run / Submit */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleRun}
            disabled={running || submitting || isLocked}
            className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-foreground border border-[#404040] px-4"
          >
            {running && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Run
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={running || submitting || isLocked}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Main content area: split pane */}
      <div className="flex flex-1 gap-0 overflow-hidden relative">
        {/* ── Left panel: Description / Submissions ── */}
        <div
          className="flex flex-col bg-[#1a1a1a] overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          {/* Left tabs */}
          <div className="flex border-b border-[#2d2d2d] bg-[#1f1f1f]">
            <button
              onClick={() => setLeftTab("description")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1",
                leftTab === "description"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Description
            </button>
            <button
              onClick={() => setLeftTab("submissions")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1",
                leftTab === "submissions"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Submissions
            </button>
          </div>

          {/* Left tab content */}
          <div className="flex-1 overflow-auto">
            {leftTab === "description" && selectedProblem && (
              <div className="p-6">
                <h1 className="text-2xl font-semibold mb-2 text-foreground">
                  {selectedProblem.order}. {selectedProblem.title}
                </h1>
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      selectedProblem.difficulty === 1
                        ? "text-emerald-400"
                        : selectedProblem.difficulty === 2
                          ? "text-amber-400"
                          : "text-rose-400"
                    )}
                  >
                    {selectedProblem.difficulty === 1
                      ? "Easy"
                      : selectedProblem.difficulty === 2
                        ? "Medium"
                        : "Hard"}
                  </span>
                  {selectedProblem.topic && (
                    <span className="text-sm text-muted-foreground">
                      · {selectedProblem.topic}
                    </span>
                  )}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedProblem.statement,
                    }}
                  />
                </div>
                {sampleCases.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-base mb-3 text-foreground">
                      Example{sampleCases.length > 1 ? "s" : ""}:
                    </h3>
                    {sampleCases.map((tc, i) => (
                      <div
                        key={tc.id}
                        className="mb-4 border border-[#2d2d2d] rounded-lg p-4 bg-[#1f1f1f]"
                      >
                        <p className="font-medium text-sm mb-2 text-foreground">
                          Example {i + 1}:
                        </p>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">
                              <strong className="text-foreground">Input:</strong>
                            </p>
                            <pre className="whitespace-pre-wrap bg-[#1a1a1a] p-2 rounded border border-[#2d2d2d] text-foreground text-xs">
                              {tc.input}
                            </pre>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">
                              <strong className="text-foreground">Output:</strong>
                            </p>
                            <pre className="whitespace-pre-wrap bg-[#1a1a1a] p-2 rounded border border-[#2d2d2d] text-foreground text-xs">
                              {tc.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedProblem.constraints && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-base mb-2 text-foreground">
                      Constraints:
                    </h3>
                    <pre className="text-sm whitespace-pre-wrap text-muted-foreground bg-[#1f1f1f] p-3 rounded border border-[#2d2d2d]">
                      {selectedProblem.constraints}
                    </pre>
                  </div>
                )}
                {selectedProblem.inputFormat && (
                  <div className="mt-4">
                    <h3 className="font-medium text-sm text-foreground">
                      Input Format
                    </h3>
                    <pre className="text-xs whitespace-pre-wrap mt-1 text-muted-foreground">
                      {selectedProblem.inputFormat}
                    </pre>
                  </div>
                )}
                {selectedProblem.outputFormat && (
                  <div className="mt-4">
                    <h3 className="font-medium text-sm text-foreground">
                      Output Format
                    </h3>
                    <pre className="text-xs whitespace-pre-wrap mt-1 text-muted-foreground">
                      {selectedProblem.outputFormat}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {leftTab === "submissions" && (
              <div className="h-full p-4 overflow-auto">
                {problemSubmissions.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No submissions yet for this problem.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground sticky top-0 bg-[#1f1f1f] border-b border-[#2d2d2d] z-10">
                      <div className="col-span-3">Status</div>
                      <div className="col-span-3">Language</div>
                      <div className="col-span-6">Date</div>
                    </div>
                    {problemSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#1a1a1a] border-b border-[#2d2d2d] hover:bg-[#252525] transition-colors text-xs"
                      >
                        <div className="col-span-3 flex items-center gap-2">
                          {sub.status === "accepted" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span className="text-emerald-400 font-medium">
                                Accepted
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-rose-400 shrink-0" />
                              <span className="text-rose-400 font-medium">
                                Wrong
                              </span>
                            </>
                          )}
                        </div>
                        <div className="col-span-3 text-foreground">
                          {sub.language}
                        </div>
                        <div className="col-span-6 text-muted-foreground truncate">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Draggable divider ── */}
        <div
          className="w-1 bg-[#2d2d2d] hover:bg-blue-500 cursor-col-resize transition-colors relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* ── Right panel: Editor + Test/Result ── */}
        <div
          className="flex flex-col bg-[#1a1a1a] overflow-hidden"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {/* Code editor — top 60% */}
          <div className="flex-1 flex flex-col bg-[#1a1a1a] overflow-hidden border-b border-[#2d2d2d]">
            <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#2d2d2d] bg-[#1f1f1f]">
              <span className="text-xs text-muted-foreground font-medium">
                Code
              </span>
              <LanguageSelector
                value={language}
                onChange={handleLanguageChange}
                disabled={isLocked}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                height="100%"
                readOnly={isLocked}
              />
            </div>
          </div>

          {/* Bottom panel — 40% */}
          <div className="h-2/5 flex flex-col bg-[#1a1a1a] border-t border-[#2d2d2d] overflow-hidden">
            {/* Bottom tabs */}
            <div className="flex border-b border-[#2d2d2d] bg-[#1f1f1f]">
              <button
                onClick={() => setBottomTab("testcase")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  bottomTab === "testcase"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Testcase
              </button>
              <button
                onClick={() => setBottomTab("result")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  bottomTab === "result"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Test Result
              </button>
              <button
                onClick={() => setBottomTab("ai-review")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5",
                  bottomTab === "ai-review"
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Brain className="h-3.5 w-3.5" />
                AI Review
                {aiEvalLoading && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </button>
            </div>

            {/* Bottom tab content */}
            <div className="flex-1 overflow-auto">
              {/* ── AI Review ── */}
              {bottomTab === "ai-review" ? (
                <div className="h-full p-4">
                  {aiEvalLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
                      <span className="text-muted-foreground text-sm">
                        AI is evaluating your code...
                      </span>
                    </div>
                  ) : aiEvaluation ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "text-2xl font-bold",
                            aiEvaluation.correctness_score >= 80
                              ? "text-emerald-400"
                              : aiEvaluation.correctness_score >= 50
                                ? "text-amber-400"
                                : "text-rose-400"
                          )}
                        >
                          {aiEvaluation.correctness_score}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            Correctness Score
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {aiEvaluation.time_complexity} time ·{" "}
                            {aiEvaluation.space_complexity} space
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            label: "Optimization",
                            score: aiEvaluation.optimization_score,
                          },
                          {
                            label: "Readability",
                            score: aiEvaluation.readability_score,
                          },
                          {
                            label: "Edge Cases",
                            score: aiEvaluation.edge_case_handling_score,
                          },
                        ].map(({ label, score }) => (
                          <div
                            key={label}
                            className="bg-[#1f1f1f] border border-[#2d2d2d] rounded p-2"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">
                                {label}
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-semibold",
                                  score >= 80
                                    ? "text-emerald-400"
                                    : score >= 50
                                      ? "text-amber-400"
                                      : "text-rose-400"
                                )}
                              >
                                {score}
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  score >= 80
                                    ? "bg-emerald-500"
                                    : score >= 50
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                )}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {aiEvaluation.issues.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                            <span className="text-xs font-semibold text-foreground">
                              Issues
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {aiEvaluation.issues.map((issue, i) => (
                              <li
                                key={i}
                                className="text-xs text-muted-foreground flex gap-1.5"
                              >
                                <span className="text-amber-400 shrink-0">
                                  •
                                </span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiEvaluation.improvement_suggestions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Lightbulb className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-xs font-semibold text-foreground">
                              Suggestions
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {aiEvaluation.improvement_suggestions.map(
                              (s, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-muted-foreground flex gap-1.5"
                                >
                                  <span className="text-blue-400 shrink-0">
                                    •
                                  </span>
                                  {s}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                      <div className="bg-[#1f1f1f] border border-[#2d2d2d] rounded p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-xs font-semibold text-foreground">
                            Overall Feedback
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {aiEvaluation.overall_feedback}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                      <Brain className="h-6 w-6" />
                      <p className="text-sm">
                        Submit your code to get an AI review.
                      </p>
                    </div>
                  )}
                </div>
              ) : bottomTab === "result" ? (
                /* ── Test Result ── */
                <div className="h-full p-4">
                  {running || submitting ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">
                        Running...
                      </span>
                    </div>
                  ) : testResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {testResult.passed === testResult.total ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-400" />
                        )}
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            testResult.passed === testResult.total
                              ? "text-emerald-400"
                              : "text-rose-400"
                          )}
                        >
                          {testResult.passed === testResult.total
                            ? "Accepted"
                            : "Wrong Answer"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {testResult.passed}/{testResult.total} passed
                        </span>
                        {testResult.runtime !== undefined && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {testResult.runtime} ms
                          </span>
                        )}
                      </div>
                      {testResult.results && testResult.results.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold text-foreground">
                            Test Cases
                          </h3>
                          {testResult.results.map((r, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "border rounded p-2 text-xs",
                                r.passed
                                  ? "border-emerald-500/30 bg-emerald-500/10"
                                  : "border-rose-500/30 bg-rose-500/10"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                  {r.passed ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-rose-400" />
                                  )}
                                  <span className="text-foreground font-medium">
                                    Case {idx + 1}
                                  </span>
                                </div>
                                {r.runtime !== undefined && (
                                  <span className="text-muted-foreground">
                                    {r.runtime} ms
                                  </span>
                                )}
                              </div>
                              {!r.passed && (
                                <div className="mt-1 space-y-1 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Input:
                                    </span>
                                    <pre className="bg-[#1a1a1a] p-1 rounded mt-1 overflow-x-auto text-foreground font-mono text-xs">
                                      {r.input.substring(0, 50)}
                                      {r.input.length > 50 ? "..." : ""}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p className="text-sm">
                        No test results yet. Click &quot;Run&quot; to test your
                        code.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Sample Test Cases ── */
                <div className="h-full p-4 overflow-auto">
                  <div className="space-y-2">
                    {sampleCases.length === 0 ? (
                      <div className="text-muted-foreground text-sm">
                        No sample test cases available.
                      </div>
                    ) : (
                      sampleCases.map((tc, i) => (
                        <div
                          key={tc.id}
                          className="border border-[#2d2d2d] rounded p-3 bg-[#1f1f1f] text-xs"
                        >
                          <p className="font-medium text-foreground mb-2">
                            Example {i + 1}
                          </p>
                          <div className="space-y-1 text-foreground font-mono text-xs">
                            <div className="line-clamp-2">
                              <strong className="text-muted-foreground">
                                In:
                              </strong>{" "}
                              {tc.input.replace(/\n/g, " | ")}
                            </div>
                            <div className="line-clamp-1">
                              <strong className="text-muted-foreground">
                                Out:
                              </strong>{" "}
                              {tc.expectedOutput.replace(/\n/g, " | ")}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Rankings at bottom ── */}
      <div className="border-t border-[#2d2d2d]">
        <RankingBoard contestId={contestId} rankings={contest.rankings} isActive={!isLocked} />
      </div>
    </div>
  );
}
