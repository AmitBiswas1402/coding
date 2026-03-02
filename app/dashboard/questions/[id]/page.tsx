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
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
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

type TabType = "description" | "testcase" | "result" | "submissions";

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
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [customTestCase, setCustomTestCase] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);

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
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          problemId: problem.id, 
          code, 
          language,
          customTestCase: customTestCase || undefined,
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

  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitting(true);
    setTestResult(null);
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
      // Refresh submissions and switch to submissions tab
      await fetchSubmissions();
      setTimeout(() => setActiveTab("submissions"), 500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submit failed");
      setTestResult({ passed: 0, total: 0, results: [] });
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-3.5rem)] bg-[#1a1a1a]">
      {/* Left: Problem Statement with Tabs - LeetCode Style */}
      <div className="lg:w-1/2 flex flex-col bg-[#1a1a1a] border-r border-[#2d2d2d]">
        {/* Tabs */}
        <div className="flex border-b border-[#2d2d2d] bg-[#1f1f1f]">
          <button
            onClick={() => setActiveTab("description")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "description"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("testcase")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "testcase"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Testcase
          </button>
          <button
            onClick={() => setActiveTab("result")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "result"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Test Result
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
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
                      <pre className="whitespace-pre-wrap bg-[#1a1a1a] p-2 rounded border border-[#2d2d2d] text-foreground">{tc.input}</pre>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1"><strong className="text-foreground">Output:</strong></p>
                      <pre className="whitespace-pre-wrap bg-[#1a1a1a] p-2 rounded border border-[#2d2d2d] text-foreground">{tc.expectedOutput}</pre>
                    </div>
                    {tc.input.includes("target") && (
                      <p className="text-xs text-muted-foreground mt-2">Explanation: {tc.input}</p>
                    )}
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

          {activeTab === "testcase" && (
            <div className="h-full p-6 overflow-auto">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Custom Test Case Input
                  </label>
                  <Textarea
                    value={customTestCase}
                    onChange={(e) => setCustomTestCase(e.target.value)}
                    placeholder="Enter your test case input here..."
                    className="min-h-[200px] bg-[#1f1f1f] border-[#2d2d2d] text-foreground font-mono text-sm"
                  />
                </div>
                <Button
                  onClick={handleRun}
                  disabled={running || submitting || !customTestCase.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Run with Custom Test Case
                </Button>
              </div>
            </div>
          )}

          {activeTab === "result" && (
            <div className="h-full p-6 overflow-auto">
              {running || submitting ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Running...</span>
                </div>
              ) : testResult ? (
                <div className="space-y-6">
                  {/* Status Header */}
                  <div className="flex items-center gap-2">
                    {testResult.passed === testResult.total ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-400" />
                    )}
                    <span className={cn(
                      "text-lg font-semibold",
                      testResult.passed === testResult.total ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {testResult.passed === testResult.total ? "Accepted" : "Wrong Answer"}
                      {testResult.runtime !== undefined && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          Runtime: {testResult.runtime} ms
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Performance Metrics */}
                  {testResult.runtime !== undefined && testResult.memory !== undefined && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Runtime */}
                      <div className="border border-[#2d2d2d] rounded-lg p-4 bg-[#1f1f1f]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-foreground">Runtime</span>
                          <span className="text-xs text-emerald-400">Beats 85%</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-2">
                          {testResult.runtime} ms
                        </div>
                        {/* Simple bar chart */}
                        <PerformanceGraph runtime={testResult.runtime} maxRuntime={50} className="mt-2" />
                        <div className="mt-2 text-xs text-muted-foreground">
                          <a href="#" className="text-blue-400 hover:underline">Analyze Complexity</a>
                        </div>
                      </div>

                      {/* Memory */}
                      <div className="border border-[#2d2d2d] rounded-lg p-4 bg-[#1f1f1f]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-foreground">Memory</span>
                          <span className="text-xs text-emerald-400">Beats 78%</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-2">
                          {testResult.memory} MB
                        </div>
                        {/* Simple bar chart */}
                        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500"
                            style={{ width: `${Math.min(100, (100 - testResult.memory) / 100 * 100)}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <a href="#" className="text-blue-400 hover:underline">Analyze Complexity</a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complexity Analysis */}
                  {testResult.complexity && (
                    <div className="border border-[#2d2d2d] rounded-lg p-4 bg-[#1f1f1f]">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Complexity Analysis</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">Time Complexity:</span>
                          <div className="text-sm font-medium text-foreground mt-1">
                            {testResult.complexity.time}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Space Complexity:</span>
                          <div className="text-sm font-medium text-foreground mt-1">
                            {testResult.complexity.space}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Case Results */}
                  {testResult.results && testResult.results.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Test Cases</h3>
                      {testResult.results.map((r, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "border rounded-lg p-3",
                            r.passed
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-rose-500/30 bg-rose-500/10"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {r.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-400" />
                              )}
                              <span className="text-sm font-medium text-foreground">
                                Case {idx + 1} {r.passed ? "Passed" : "Failed"}
                              </span>
                            </div>
                            {r.runtime !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {r.runtime} ms
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Input:</span>
                              <pre className="mt-1 bg-[#1a1a1a] p-2 rounded text-foreground font-mono">{r.input}</pre>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expected:</span>
                              <pre className="mt-1 bg-[#1a1a1a] p-2 rounded text-foreground font-mono">{r.expected}</pre>
                            </div>
                            {!r.passed && (
                              <div>
                                <span className="text-muted-foreground">Your Output:</span>
                                <pre className="mt-1 bg-[#1a1a1a] p-2 rounded text-foreground font-mono">{r.output}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No test results yet. Click "Run" to test your code.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="h-full p-6 overflow-auto">
              {submissions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No submissions yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="border border-[#2d2d2d] rounded-lg p-3 bg-[#1f1f1f]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sub.status === "accepted" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-400" />
                          )}
                          <span className={cn(
                            "text-sm font-medium",
                            sub.status === "accepted" ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {sub.status}
                          </span>
                          <span className="text-xs text-muted-foreground">{sub.language}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Code Editor Only - LeetCode Style */}
      <div className="lg:w-1/2 flex flex-col bg-[#1a1a1a] border-l border-[#2d2d2d]">
        {/* Top Bar with Language and Buttons */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#2d2d2d] bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <LanguageSelector
              value={language}
              onChange={handleLanguageChange}
            />
            <span className="text-xs text-muted-foreground">Auto</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={handleRun} 
              disabled={running || submitting}
              className="bg-[#1a1a1a] hover:bg-[#2d2d2d] text-foreground border border-[#2d2d2d]"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit} 
              disabled={running || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
