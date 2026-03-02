"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { LanguageSelector } from "@/components/editor/LanguageSelector";
import { getGenericTemplate } from "@/lib/code-templates";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Loader2, Brain, AlertTriangle, Lightbulb, TrendingUp, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerformanceGraph } from "@/components/problems/PerformanceGraph";

type Problem = {
  id: string;
  title: string;
  statement: string;
  constraints: string | null;
  inputFormat: string | null;
  outputFormat: string | null;
  difficulty: number;
  topic: string | null;
  testCases?: { id: string; input: string; expectedOutput: string; isSample: boolean }[];
  sampleTestCases?: { id: string; input: string; expectedOutput: string; isSample: boolean }[];
};

type TestResult = {
  passed: number;
  total: number;
  runtime?: number;
  memory?: number;
  complexity?: {
    time: string;
    space: string;
  };
  results?: Array<{
    input: string;
    expected: string;
    output: string;
    passed: boolean;
    runtime?: number;
  }>;
};

type Submission = {
  id: string;
  status: string;
  language: string;
  createdAt: string;
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

type TabType = "description" | "testcase" | "result" | "submissions";
type TestcaseSubTab = "sample" | "custom" | "result" | "ai-review";

export default function QuestionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(getGenericTemplate("java"));
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [testcaseSubTab, setTestcaseSubTab] = useState<TestcaseSubTab>("sample");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [customTestCase, setCustomTestCase] = useState("");
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leftWidth, setLeftWidth] = useState(40); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<AiEvaluation | null>(null);
  const [aiEvalLoading, setAiEvalLoading] = useState(false);
  const [postSubmitRecs, setPostSubmitRecs] = useState<
    { title: string; difficulty: string; topic: string; focus_area: string; reason: string }[]
  >([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const fetchProblem = useCallback(async () => {
    try {
      const res = await fetch(`/api/problems/${id}`);
      if (!res.ok) throw new Error("Failed to load problem");
      const data = await res.json();
      setProblem(data);
    } catch {
      toast.error("Failed to load problem");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProblem();
    fetchSubmissions();
  }, [fetchProblem, id]);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/problems/${id}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    }
  }, [id]);

  const handleRun = async () => {
    if (!problem) return;
    setRunning(true);
    setTestResult(null);
    // Switch to result tab after a brief delay to show loading
    setTimeout(() => setActiveTab("result"), 100);
    try {
      // Determine if we're running sample or custom test case
      let customInput = "";
      
      if (testcaseSubTab === "custom" && customTestCase.trim()) {
        customInput = customTestCase;
      } else if (testcaseSubTab === "sample" && selectedSampleIndex !== null) {
        const sampleCases = problem.testCases?.filter((tc) => tc.isSample) ?? problem.sampleTestCases ?? [];
        customInput = sampleCases[selectedSampleIndex]?.input || "";
      }

      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          problemId: problem.id, 
          code, 
          language,
          customTestCase: customInput || undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Run failed");
      }
      const data = await res.json();
      setTestResult(data.runResult || { passed: 0, total: 0 });
      if (data.accepted) {
        toast.success(data.message || "All test cases passed!");
      } else {
        toast.error(data.message || "Some test cases failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Run failed");
      setTestResult({ passed: 0, total: 0, results: [] });
    } finally {
      setRunning(false);
    }
  };

  const handleRunSample = async (sampleIndex: number) => {
    setSelectedSampleIndex(sampleIndex);
    setTimeout(() => handleRun(), 50);
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitting(true);
    setTestResult(null);
    setAiEvaluation(null);
    // Switch to result tab after a brief delay to show loading
    setTimeout(() => setActiveTab("result"), 100);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, code, language }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Submit failed");
      }
      const data = await res.json();
      setTestResult(data.runResult || { passed: 0, total: 0 });
      if (data.status === "accepted") {
        toast.success("Accepted!");
      } else {
        toast.error(data.message || "Submission failed");
      }
      // Refresh submissions
      await fetchSubmissions();

      // Start polling for AI evaluation
      if (data.submissionId) {
        pollAiEvaluation(data.submissionId);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submit failed");
      setTestResult({ passed: 0, total: 0, results: [] });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPostSubmitRecs = async (subId: string) => {
    setRecsLoading(true);
    try {
      const res = await fetch(`/api/ai/recommend/post-submit?submissionId=${subId}`);
      if (res.ok) {
        const data = await res.json();
        setPostSubmitRecs(data.recommendations || []);
      }
    } catch (err) {
      console.error("Post-submit recommendations error:", err);
    } finally {
      setRecsLoading(false);
    }
  };

  const pollAiEvaluation = (submissionId: string) => {
    setAiEvalLoading(true);
    setTestcaseSubTab("ai-review");
    let attempts = 0;
    const maxAttempts = 15; // ~30 seconds at 2s intervals

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/ai/analyze-code?submissionId=${submissionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "complete" && data.evaluation) {
            setAiEvaluation(data.evaluation);
            setAiEvalLoading(false);
            // Fetch post-submission recommendations
            fetchPostSubmitRecs(submissionId);
            return; // Stop polling
          }
        }
      } catch {
        // Continue polling on network error
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setAiEvalLoading(false);
        // Evaluation timed out — leave as null
      }
    };

    setTimeout(poll, 3000); // Initial delay to let AI process
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 20 && newWidth < 80) {
      setLeftWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (loading) return <div className="p-8 text-foreground">Loading problem…</div>;
  if (!problem) return <div className="p-8 text-destructive">Problem not found.</div>;

  const sampleCases = problem.testCases?.filter((tc) => tc.isSample) ?? problem.sampleTestCases ?? [];
  const difficultyLabel = problem.difficulty === 1 ? "Easy" : problem.difficulty === 2 ? "Medium" : "Hard";
  const difficultyColor = problem.difficulty === 1 ? "text-emerald-400" : problem.difficulty === 2 ? "text-amber-400" : "text-rose-400";

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    // Reset to template when language changes
    setCode(getGenericTemplate(lang));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#1a1a1a]">
      {/* Top Bar - Run/Submit Center Only */}
      <div className="border-b border-[#2d2d2d] bg-[#1f1f1f] px-4 py-2 flex items-center justify-center gap-3">
        <Button 
          size="sm"
          onClick={() => {
            if (selectedSampleIndex === null && sampleCases.length > 0) {
              handleRunSample(0);
            } else {
              handleRun();
            }
          }}
          disabled={running || submitting}
          className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-foreground border border-[#404040] px-4"
          title="Run code"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Run
        </Button>
        <Button 
          size="sm"
          onClick={handleSubmit} 
          disabled={running || submitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4"
          title="Submit code"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Submit
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-0 overflow-hidden relative">
        {/* Left: Problem Description & Submissions */}
        <div 
          className="flex flex-col bg-[#1a1a1a] overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          {/* Tabs */}
          <div className="flex border-b border-[#2d2d2d] bg-[#1f1f1f]">
            <button
              onClick={() => setActiveTab("description")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1",
                activeTab === "description"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1",
                activeTab === "submissions"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Submissions
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === "description" && (
              <div className="p-6">
              <h1 className="text-2xl font-semibold mb-2 text-foreground">{problem.title}</h1>
              <div className="flex items-center gap-3 mb-6">
                <span className={cn("text-sm font-medium", difficultyColor)}>{difficultyLabel}</span>
                {problem.topic && (
                  <span className="text-sm text-muted-foreground">· {problem.topic}</span>
                )}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <div dangerouslySetInnerHTML={{ __html: problem.statement }} />
              </div>
              {sampleCases.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-base mb-3 text-foreground">Example {sampleCases.length > 1 ? "s" : ""}:</h3>
                  {sampleCases.map((tc, i) => (
                    <div key={tc.id} className="mb-4 border border-[#2d2d2d] rounded-lg p-4 bg-[#1f1f1f]">
                      <p className="font-medium text-sm mb-2 text-foreground">Example {i + 1}:</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1"><strong className="text-foreground">Input:</strong></p>
                          <pre className="whitespace-pre-wrap bg-[#1a1a1a] p-2 rounded border border-[#2d2d2d] text-foreground text-xs">{tc.input}</pre>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1"><strong className="text-foreground">Output:</strong></p>
                          <pre className="whitespace-pre-wrap bg-[#1a1a1a] p-2 rounded border border-[#2d2d2d] text-foreground text-xs">{tc.expectedOutput}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {problem.constraints && (
                <div className="mt-6">
                  <h3 className="font-semibold text-base mb-2 text-foreground">Constraints:</h3>
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground bg-[#1f1f1f] p-3 rounded border border-[#2d2d2d]">{problem.constraints}</pre>
                </div>
              )}
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="h-full p-4 overflow-auto">
              {submissions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No submissions yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground sticky top-0 bg-[#1f1f1f] border-b border-[#2d2d2d] z-10">
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Language</div>
                    <div className="col-span-2">Runtime</div>
                    <div className="col-span-2">Memory</div>
                    <div className="col-span-4">Date</div>
                  </div>

                  {/* Table Rows */}
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#1a1a1a] border-b border-[#2d2d2d] hover:bg-[#252525] transition-colors text-xs"
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        {sub.status === "accepted" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                            <span className="text-emerald-400 font-medium truncate">Accepted</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-rose-400 shrink-0" />
                            <span className="text-rose-400 font-medium truncate">Wrong</span>
                          </>
                        )}
                      </div>
                      <div className="col-span-2 text-foreground">{sub.language}</div>
                      <div className="col-span-2 text-muted-foreground">-</div>
                      <div className="col-span-2 text-muted-foreground">-</div>
                      <div className="col-span-4 text-muted-foreground truncate">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Draggable Divider */}
      <div
        className="w-1 bg-[#2d2d2d] hover:bg-blue-500 cursor-col-resize transition-colors relative group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      {/* Right: Code Editor (Top) + Testcase/Result (Bottom) */}
      <div 
        className="flex flex-col bg-[#1a1a1a] overflow-hidden"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {/* Code Editor - Top 60% */}
        <div className="flex-1 flex flex-col bg-[#1a1a1a] overflow-hidden border-b border-[#2d2d2d]">
          {/* Code header bar with language dropdown */}
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#2d2d2d] bg-[#1f1f1f]">
            <span className="text-xs text-muted-foreground font-medium">Code</span>
            <LanguageSelector
              value={language}
              onChange={handleLanguageChange}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              height="100%"
            />
          </div>
        </div>

        {/* Test Case / Test Result - Bottom 40% */}
        <div className="h-2/5 flex flex-col bg-[#1a1a1a] border-t border-[#2d2d2d] overflow-hidden">
          {/* Subtabs */}
          <div className="flex border-b border-[#2d2d2d] bg-[#1f1f1f]">
            <button
              onClick={() => {
                setTestcaseSubTab("sample");
                setSelectedSampleIndex(null);
              }}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                testcaseSubTab === "sample"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Testcase
            </button>
            <button
              onClick={() => setTestcaseSubTab("result")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                testcaseSubTab === "result"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Test Result
            </button>
            <button
              onClick={() => setTestcaseSubTab("ai-review")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5",
                testcaseSubTab === "ai-review"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Brain className="h-3.5 w-3.5" />
              AI Review
              {aiEvalLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {testcaseSubTab === "ai-review" ? (
              <div className="h-full p-4">
                {aiEvalLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
                    <span className="text-muted-foreground text-sm">AI is evaluating your code...</span>
                    <span className="text-muted-foreground text-xs">This may take a few seconds</span>
                  </div>
                ) : aiEvaluation ? (
                  <div className="space-y-4">
                    {/* Overall Score */}
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "text-2xl font-bold",
                        aiEvaluation.correctness_score >= 80 ? "text-emerald-400" :
                        aiEvaluation.correctness_score >= 50 ? "text-amber-400" : "text-rose-400"
                      )}>
                        {aiEvaluation.correctness_score}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Correctness Score</div>
                        <div className="text-xs text-muted-foreground">
                          {aiEvaluation.time_complexity} time · {aiEvaluation.space_complexity} space
                        </div>
                      </div>
                    </div>

                    {/* Score Bars */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Optimization", score: aiEvaluation.optimization_score },
                        { label: "Readability", score: aiEvaluation.readability_score },
                        { label: "Edge Cases", score: aiEvaluation.edge_case_handling_score },
                      ].map(({ label, score }) => (
                        <div key={label} className="bg-[#1f1f1f] border border-[#2d2d2d] rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <span className={cn(
                              "text-xs font-semibold",
                              score >= 80 ? "text-emerald-400" :
                              score >= 50 ? "text-amber-400" : "text-rose-400"
                            )}>{score}</span>
                          </div>
                          <div className="h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                score >= 80 ? "bg-emerald-500" :
                                score >= 50 ? "bg-amber-500" : "bg-rose-500"
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Issues */}
                    {aiEvaluation.issues.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs font-semibold text-foreground">Issues</span>
                        </div>
                        <ul className="space-y-1">
                          {aiEvaluation.issues.map((issue, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                              <span className="text-amber-400 shrink-0">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {aiEvaluation.improvement_suggestions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Lightbulb className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-xs font-semibold text-foreground">Suggestions</span>
                        </div>
                        <ul className="space-y-1">
                          {aiEvaluation.improvement_suggestions.map((s, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                              <span className="text-blue-400 shrink-0">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Overall Feedback */}
                    <div className="bg-[#1f1f1f] border border-[#2d2d2d] rounded p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-xs font-semibold text-foreground">Overall Feedback</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {aiEvaluation.overall_feedback}
                      </p>
                    </div>

                    {/* Post-Submission Recommendations */}
                    {recsLoading && (
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                        <span className="text-xs text-muted-foreground">Finding your next challenges...</span>
                      </div>
                    )}

                    {postSubmitRecs.length > 0 && (
                      <div className="mt-1">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-xs font-semibold text-foreground">Try Next</span>
                        </div>
                        <div className="space-y-2">
                          {postSubmitRecs.map((rec, i) => (
                            <div
                              key={i}
                              className="bg-[#1f1f1f] border border-[#2d2d2d] rounded p-3 hover:border-purple-500/40 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Target className="h-3 w-3 text-purple-400" />
                                  <span className="text-xs font-semibold text-foreground">{rec.title}</span>
                                </div>
                                <span
                                  className={cn(
                                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                                    rec.difficulty === "Easy"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : rec.difficulty === "Medium"
                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  )}
                                >
                                  {rec.difficulty}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] text-muted-foreground">{rec.topic}</span>
                                <span className="text-[10px] text-purple-400/70">· {rec.focus_area}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-snug">{rec.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <Brain className="h-6 w-6" />
                    <p className="text-sm">Submit your code to get an AI review.</p>
                  </div>
                )}
              </div>
            ) : testcaseSubTab === "result" ? (
              <div className="h-full p-4">
                {running || submitting ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Running...</span>
                  </div>
                ) : testResult ? (
                  <div className="space-y-4">
                    {/* Status Header */}
                    <div className="flex items-center gap-2">
                      {testResult.passed === testResult.total ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-400" />
                      )}
                      <span className={cn(
                        "text-sm font-semibold",
                        testResult.passed === testResult.total ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {testResult.passed === testResult.total ? "Accepted" : "Wrong Answer"}
                      </span>
                      {testResult.runtime !== undefined && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {testResult.runtime} ms
                        </span>
                      )}
                    </div>

                    {/* Test Cases */}
                    {testResult.results && testResult.results.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-foreground">Test Cases</h3>
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
                                  <span className="text-muted-foreground">Input:</span>
                                  <pre className="bg-[#1a1a1a] p-1 rounded mt-1 overflow-x-auto text-foreground font-mono text-xs">{r.input.substring(0, 50)}{r.input.length > 50 ? "..." : ""}</pre>
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
                    <p className="text-sm">No test results yet. Click "Run" to test your code.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full p-4 overflow-auto">
                {/* Sample Test Cases */}
                <div className="space-y-2">
                  {sampleCases.length === 0 ? (
                    <div className="text-muted-foreground text-sm">No sample test cases available.</div>
                  ) : (
                    sampleCases.map((tc, i) => (
                      <div
                        key={tc.id}
                        className={cn(
                          "border rounded p-3 bg-[#1f1f1f] transition-all cursor-pointer text-xs",
                          selectedSampleIndex === i
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-[#2d2d2d] hover:border-[#3d3d3d]"
                        )}
                        onClick={() => setSelectedSampleIndex(i)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-foreground">Example {i + 1}</p>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunSample(i);
                            }}
                            disabled={running || submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-6 px-2 text-xs"
                          >
                            {running && selectedSampleIndex === i ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Run"
                            )}
                          </Button>
                        </div>
                        <div className="space-y-1 text-foreground font-mono text-xs">
                          <div className="line-clamp-2">
                            <strong className="text-muted-foreground">In:</strong> {tc.input.replace(/\n/g, " | ")}
                          </div>
                          <div className="line-clamp-1">
                            <strong className="text-muted-foreground">Out:</strong> {tc.expectedOutput.replace(/\n/g, " | ")}
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
  </div>
  );
}
