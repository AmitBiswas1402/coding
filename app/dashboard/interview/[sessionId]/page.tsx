"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { LanguageSelector } from "@/components/editor/LanguageSelector";
import { InterviewTimer } from "@/components/interview/InterviewTimer";
import {
  useInterviewStore,
  type InterviewTestResult,
} from "@/stores/interview-store";
import type { InterviewQuestion } from "@/lib/ai/prompts/interview-question";
import type { InterviewScores } from "@/lib/ai/prompts/interview-evaluation";
import { getGenericTemplate } from "@/lib/code-templates";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  Lightbulb,
  Lock,
  ArrowLeft,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type LeftTab = "description" | "hints";
type BottomTab = "testcase" | "result" | "ai-review";

// ── Hire badge colors ──
const HIRE_COLORS: Record<string, string> = {
  "Strong Hire": "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  Hire: "bg-green-500/20 text-green-400 border-green-500/40",
  "Lean Hire": "bg-amber-500/20 text-amber-400 border-amber-500/40",
  "No Hire": "bg-rose-500/20 text-rose-400 border-rose-500/40",
};

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const {
    question,
    endsAt,
    isLocked,
    status,
    testResult,
    code,
    language,
    runAttempts,
    scores,
    level,
    companyCategory,
    topic,
    setSession,
    setConfig,
    setStatus,
    lockSession,
    setTestResult,
    incrementRuns,
    setCode,
    setLanguage,
    setScores,
    reset,
  } = useInterviewStore();

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // UI state
  const [leftTab, setLeftTab] = useState<LeftTab>("description");
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcase");
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);

  // ── Fetch session data ──
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/interview/${sessionId}`);
      if (!res.ok) throw new Error("Session not found");
      const data = await res.json();
      const s = data.session;
      const q = s.question as InterviewQuestion;

      setSession(s.id, q, s.endsAt);
      setConfig(s.level, s.companyCategory, s.topic);

      if (s.status === "expired" || s.status === "completed") {
        lockSession();
        if (s.status === "completed") setStatus("completed");
      }

      // Restore result if already submitted
      if (data.result) {
        setScores(data.result.scores as InterviewScores);
        if (data.result.code) setCode(data.result.code);
        if (data.result.language) setLanguage(data.result.language);
      } else {
        // Default template
        if (!code) setCode(getGenericTemplate("java"));
      }
    } catch {
      toast.error("Failed to load interview session");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    return () => reset();
  }, [fetchSession]);

  // ── Draggable split pane ──
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const w = (e.clientX / window.innerWidth) * 100;
      if (w > 20 && w < 80) setLeftWidth(w);
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

  // ── Run code (mock) ──
  const handleRun = async () => {
    if (isLocked) return;
    setRunning(true);
    setTestResult(null);
    setTimeout(() => setBottomTab("result"), 100);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      const result: InterviewTestResult = data.runResult ?? {
        passed: 0,
        total: 0,
      };
      setTestResult(result);
      incrementRuns();
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

  // ── Submit for AI evaluation ──
  const handleSubmit = async () => {
    if (isLocked && status !== "active") return;
    if (!code.trim()) {
      toast.error("Write some code before submitting");
      return;
    }
    setSubmitting(true);
    setStatus("submitting");
    setBottomTab("ai-review");
    try {
      const elapsed = Math.round((Date.now() - startTime) / 60000);
      const res = await fetch(`/api/interview/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          solveTimeMinutes: elapsed,
          runAttempts,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submit failed");
      }
      const data = await res.json();
      setScores(data.scores);
      lockSession();
      toast.success("Interview evaluated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
      setStatus("active");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Time up handler ──
  const handleTimeUp = () => {
    lockSession();
    toast("Time's up!");
    if (code.trim() && status === "active") {
      handleSubmit();
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(getGenericTemplate(lang));
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#1a1a1a] text-white">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading interview…
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#1a1a1a]">
        <Card className="max-w-md w-full bg-[#1f1f1f] border-[#2d2d2d]">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-zinc-400">Interview session not found.</p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/interview")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Completed: show results view ──
  if (status === "completed" && scores) {
    const overall = Math.round(
      (scores.technical_score +
        scores.problem_solving_score +
        scores.optimization_score +
        scores.code_quality_score +
        scores.communication_score +
        scores.time_management_score) /
        6
    );
    const hireBadge = HIRE_COLORS[scores.hire_recommendation] ?? HIRE_COLORS["No Hire"];

    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#1a1a1a] text-white overflow-auto">
        {/* Top bar */}
        <div className="border-b border-[#2d2d2d] bg-[#1f1f1f] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/interview")}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-lg font-bold">{question.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-[#2d2d2d]">{level}</span>
            <span className="px-2 py-0.5 rounded bg-[#2d2d2d]">{companyCategory}</span>
            {topic && topic !== "Mixed" && (
              <span className="px-2 py-0.5 rounded bg-[#2d2d2d]">{topic}</span>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
          {/* Header scores */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <div
                className={cn(
                  "text-5xl font-bold",
                  overall >= 80
                    ? "text-emerald-400"
                    : overall >= 60
                      ? "text-amber-400"
                      : "text-rose-400"
                )}
              >
                {overall}
              </div>
              <div className="text-sm text-zinc-400 mt-1">Overall Score</div>
            </div>
            <div
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-semibold",
                hireBadge
              )}
            >
              {scores.hire_recommendation}
            </div>
          </div>

          {/* Score bars */}
          <div className="grid gap-3">
            {[
              { label: "Technical Correctness", value: scores.technical_score },
              { label: "Problem Solving", value: scores.problem_solving_score },
              { label: "Optimization", value: scores.optimization_score },
              { label: "Code Quality", value: scores.code_quality_score },
              { label: "Communication", value: scores.communication_score },
              { label: "Time Management", value: scores.time_management_score },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-sm text-zinc-400 w-44 shrink-0">{s.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#2d2d2d] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      s.value >= 80
                        ? "bg-emerald-500"
                        : s.value >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    )}
                    style={{ width: `${s.value}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold w-10 text-right",
                    s.value >= 80
                      ? "text-emerald-400"
                      : s.value >= 60
                        ? "text-amber-400"
                        : "text-rose-400"
                  )}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-4">
            {scores.strengths.length > 0 && (
              <Card className="bg-[#1f1f1f] border-emerald-500/20">
                <CardContent className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Strengths
                  </h3>
                  <ul className="space-y-1">
                    {scores.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {scores.weaknesses.length > 0 && (
              <Card className="bg-[#1f1f1f] border-rose-500/20">
                <CardContent className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" /> Weaknesses
                  </h3>
                  <ul className="space-y-1">
                    {scores.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                        <XCircle className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detailed feedback */}
          {scores.detailed_feedback && (
            <Card className="bg-[#1f1f1f] border-[#2d2d2d]">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" /> Detailed Feedback
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {scores.detailed_feedback}
                </p>
              </CardContent>
            </Card>
          )}

          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/interview")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Start New Interview
          </Button>
        </div>
      </div>
    );
  }

  // ── Main interview IDE ──
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#1a1a1a]">
      {/* Top bar */}
      <div className="border-b border-[#2d2d2d] bg-[#1f1f1f] px-4 py-2 flex items-center justify-between gap-4">
        {/* Left: title + badges */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/interview")}
            className="text-zinc-400 hover:text-white shrink-0 h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold text-white truncate">
            {question.title}
          </h1>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded shrink-0",
              question.difficulty_level === "Easy"
                ? "bg-emerald-500/20 text-emerald-400"
                : question.difficulty_level === "Medium"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-rose-500/20 text-rose-400"
            )}
          >
            {question.difficulty_level}
          </span>
          <span className="text-xs text-zinc-500 shrink-0 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {question.expected_time_minutes}m
          </span>
        </div>

        {/* Center: timer */}
        <div className="shrink-0">
          <InterviewTimer endsAt={endsAt} onEnd={handleTimeUp} />
        </div>

        {/* Right: Run / Submit */}
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

      {/* Split pane */}
      <div className="flex flex-1 gap-0 overflow-hidden relative">
        {/* ── Left panel ── */}
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
              onClick={() => setLeftTab("hints")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 flex items-center gap-1.5 justify-center",
                leftTab === "hints"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Hints
            </button>
          </div>

          {/* Left content */}
          <div className="flex-1 overflow-auto">
            {leftTab === "description" && (
              <div className="p-6 space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground mb-2">
                    {question.title}
                  </h1>
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        question.difficulty_level === "Easy"
                          ? "text-emerald-400"
                          : question.difficulty_level === "Medium"
                            ? "text-amber-400"
                            : "text-rose-400"
                      )}
                    >
                      {question.difficulty_level}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      · {question.expected_time_minutes} minutes
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                  <p className="whitespace-pre-wrap">{question.description}</p>
                </div>

                {/* Examples */}
                {question.examples.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-base mb-3 text-foreground">
                      Example{question.examples.length > 1 ? "s" : ""}:
                    </h3>
                    {question.examples.map((ex, i) => (
                      <div
                        key={i}
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
                              {ex.input}
                            </pre>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">
                              <strong className="text-foreground">Output:</strong>
                            </p>
                            <pre className="whitespace-pre-wrap bg-[#1a1a1a] p-2 rounded border border-[#2d2d2d] text-foreground text-xs">
                              {ex.output}
                            </pre>
                          </div>
                          {ex.explanation && (
                            <div>
                              <p className="text-muted-foreground mb-1">
                                <strong className="text-foreground">Explanation:</strong>
                              </p>
                              <p className="text-sm text-zinc-400">{ex.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {question.constraints && (
                  <div>
                    <h3 className="font-semibold text-base mb-2 text-foreground">
                      Constraints:
                    </h3>
                    <pre className="text-sm whitespace-pre-wrap text-muted-foreground bg-[#1f1f1f] p-3 rounded border border-[#2d2d2d]">
                      {question.constraints}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {leftTab === "hints" && (
              <div className="p-6">
                {question.hints.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hints available.</p>
                ) : (
                  <div className="space-y-3">
                    {question.hints.map((hint, i) => (
                      <HintCard key={i} index={i} hint={hint} />
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

        {/* ── Right panel ── */}
        <div
          className="flex flex-col bg-[#1a1a1a] overflow-hidden"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {/* Code editor — top */}
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
              {isLocked && (
                <Lock className="h-3.5 w-3.5 text-zinc-500 ml-auto" />
              )}
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

          {/* Bottom panel */}
          <div className="h-2/5 flex flex-col bg-[#1a1a1a] border-t border-[#2d2d2d] overflow-hidden">
            {/* Tabs */}
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
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
              {/* Testcase tab */}
              {bottomTab === "testcase" && (
                <div className="p-4">
                  {question.examples.length > 0 ? (
                    <div className="space-y-3">
                      {question.examples.map((ex, i) => (
                        <div
                          key={i}
                          className="border border-[#2d2d2d] rounded-lg p-3 bg-[#1f1f1f]"
                        >
                          <p className="text-xs text-zinc-500 mb-1 font-medium">
                            Case {i + 1}
                          </p>
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="text-zinc-500">Input: </span>
                              <code className="text-foreground">{ex.input}</code>
                            </div>
                            <div>
                              <span className="text-zinc-500">Expected: </span>
                              <code className="text-foreground">{ex.output}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No sample test cases provided.
                    </p>
                  )}
                </div>
              )}

              {/* Result tab */}
              {bottomTab === "result" && (
                <div className="p-4">
                  {running ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running code...
                    </div>
                  ) : testResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {testResult.passed === testResult.total && testResult.total > 0 ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-400" />
                        )}
                        <span
                          className={cn(
                            "font-semibold text-sm",
                            testResult.passed === testResult.total && testResult.total > 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          )}
                        >
                          {testResult.passed}/{testResult.total} test cases passed
                        </span>
                      </div>
                      {testResult.runtime !== undefined && (
                        <div className="flex gap-4 text-xs text-zinc-400">
                          <span>Runtime: {testResult.runtime}ms</span>
                          {testResult.memory && <span>Memory: {testResult.memory}</span>}
                          {testResult.complexity && (
                            <span>Complexity: {testResult.complexity}</span>
                          )}
                        </div>
                      )}
                      {testResult.results?.map((r, i) => (
                        <div
                          key={i}
                          className={cn(
                            "border rounded-lg p-3 text-xs",
                            r.passed
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-rose-500/30 bg-rose-500/5"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {r.passed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-400" />
                            )}
                            <span className="font-medium text-foreground">
                              Case {i + 1}
                            </span>
                          </div>
                          <div className="space-y-0.5 text-zinc-400">
                            <div>Input: <code>{r.input}</code></div>
                            {r.expected && (
                              <div>Expected: <code className="text-foreground">{r.expected}</code></div>
                            )}
                            {r.actual && (
                              <div>
                                Actual:{" "}
                                <code className={r.passed ? "text-emerald-400" : "text-rose-400"}>
                                  {r.actual}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Run your code to see results.
                    </p>
                  )}
                </div>
              )}

              {/* AI Review tab */}
              {bottomTab === "ai-review" && (
                <div className="p-4">
                  {submitting ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                      <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
                      <span className="text-muted-foreground text-sm">
                        AI is evaluating your code…
                      </span>
                    </div>
                  ) : scores ? (
                    <div className="space-y-4">
                      {/* Quick summary */}
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "text-2xl font-bold",
                            scores.technical_score >= 80
                              ? "text-emerald-400"
                              : scores.technical_score >= 60
                                ? "text-amber-400"
                                : "text-rose-400"
                          )}
                        >
                          {scores.technical_score}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            Technical Score
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {scores.hire_recommendation}
                          </div>
                        </div>
                      </div>

                      {/* Mini score bars */}
                      <div className="grid gap-2">
                        {[
                          { l: "Problem Solving", v: scores.problem_solving_score },
                          { l: "Optimization", v: scores.optimization_score },
                          { l: "Code Quality", v: scores.code_quality_score },
                          { l: "Communication", v: scores.communication_score },
                          { l: "Time Mgmt", v: scores.time_management_score },
                        ].map((s) => (
                          <div key={s.l} className="flex items-center gap-2 text-xs">
                            <span className="text-zinc-500 w-28 shrink-0">{s.l}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-[#2d2d2d] overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  s.v >= 80
                                    ? "bg-emerald-500"
                                    : s.v >= 60
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                )}
                                style={{ width: `${s.v}%` }}
                              />
                            </div>
                            <span className="text-zinc-400 w-6 text-right">{s.v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Feedback inline */}
                      {scores.detailed_feedback && (
                        <p className="text-xs text-zinc-400 leading-relaxed border-t border-[#2d2d2d] pt-3 mt-2">
                          {scores.detailed_feedback}
                        </p>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/dashboard/interview")}
                        className="mt-2"
                      >
                        View Full Results
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Submit your code to get AI evaluation.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Expandable hint card ──
function HintCard({ index, hint }: { index: number; hint: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="border border-[#2d2d2d] rounded-lg bg-[#1f1f1f] overflow-hidden">
      <button
        onClick={() => setRevealed(!revealed)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#252525] transition-colors"
      >
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          Hint {index + 1}
        </span>
        <span className="text-xs text-zinc-500">
          {revealed ? "Hide" : "Reveal"}
        </span>
      </button>
      {revealed && (
        <div className="px-4 pb-3 text-sm text-zinc-400 border-t border-[#2d2d2d] pt-3">
          {hint}
        </div>
      )}
    </div>
  );
}
