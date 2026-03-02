"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAnalyticsStore } from "@/stores/analytics-store";
import {
  Brain,
  AlertTriangle,
  Target,
  TrendingDown,
  Shield,
  Loader2,
  Activity,
  Eye,
} from "lucide-react";

interface WeaknessAnalytics {
  result: {
    weak_topics: { topic: string; accuracy: number; suggestion: string }[];
    behavior_patterns: {
      pattern: string;
      severity: "low" | "medium" | "high";
      description: string;
    }[];
    risk_areas: {
      area: string;
      risk_level: "low" | "medium" | "high";
      detail: string;
    }[];
    improvement_plan: {
      step: number;
      action: string;
      expected_outcome: string;
    }[];
    confidence_score: number;
  };
  stats: {
    totalAttempted: number;
    totalSolved: number;
    failedAttempts: number;
    topicAccuracy: {
      topic: string;
      accuracy: number;
      attempted: number;
      solved: number;
    }[];
  };
}

const severityColor = {
  low: "text-green-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

const severityBg = {
  low: "bg-green-400/10",
  medium: "bg-amber-400/10",
  high: "bg-red-400/10",
};

export default function AnalyticsPage() {
  const { submissionsByDay, problemsSolved, accuracy, streak, setStats } =
    useAnalyticsStore();

  const [weakness, setWeakness] = useState<WeaknessAnalytics | null>(null);
  const [weaknessLoading, setWeaknessLoading] = useState(false);
  const [weaknessLoaded, setWeaknessLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/analytics/me")
      .then((r) => r.json())
      .then((data) =>
        setStats({
          submissionsByDay: data.submissionsByDay ?? [],
          problemsSolved: data.problemsSolved ?? 0,
          accuracy: data.accuracy ?? 0,
          streak: data.streak ?? 0,
        })
      )
      .catch(() => {});
  }, [setStats]);

  const fetchWeaknessAnalytics = async () => {
    setWeaknessLoading(true);
    try {
      const res = await fetch("/api/ai/weakness-analytics");
      if (!res.ok) throw new Error("Failed");
      const data: WeaknessAnalytics = await res.json();
      setWeakness(data);
      setWeaknessLoaded(true);
    } catch {
      setWeakness(null);
    } finally {
      setWeaknessLoading(false);
    }
  };

  const confidenceColor = (score: number) =>
    score >= 70
      ? "bg-green-500"
      : score >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your progress over time across problems, races, and contests.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Problems solved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{problemsSolved}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{accuracy}%</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Streak (days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{streak}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {submissionsByDay.reduce((a, b) => a + b.count, 0)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions by day</CardTitle>
        </CardHeader>
        <CardContent>
          {submissionsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={submissionsByDay}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          )}
        </CardContent>
      </Card>

      {/* ─── AI Weakness Analysis Section ─── */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Weakness Analysis</h2>
              <p className="text-sm text-muted-foreground">
                Deep analysis of your coding patterns, weak areas, and
                improvement roadmap
              </p>
            </div>
          </div>
          <Button
            onClick={fetchWeaknessAnalytics}
            disabled={weaknessLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {weaknessLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : weaknessLoaded ? (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Re-analyze
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Analyze My Weaknesses
              </>
            )}
          </Button>
        </div>

        {weakness && (
          <div className="space-y-6">
            {/* Confidence Score */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Analysis Confidence
              </span>
              <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${confidenceColor(weakness.result.confidence_score)}`}
                  style={{
                    width: `${weakness.result.confidence_score}%`,
                  }}
                />
              </div>
              <span className="text-sm font-bold">
                {weakness.result.confidence_score}%
              </span>
            </div>

            {/* 2×2 Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Weak Topics */}
              <Card className="border-rose-500/20 bg-rose-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                    Weak Topics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.result.weak_topics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No significant weaknesses detected.
                    </p>
                  ) : (
                    weakness.result.weak_topics.map((t, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-white/5 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{t.topic}</span>
                          <span className="text-xs text-rose-400">
                            {t.accuracy.toFixed(0)}% accuracy
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t.suggestion}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Behavior Patterns */}
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-amber-400" />
                    Behavior Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.result.behavior_patterns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No notable patterns detected.
                    </p>
                  ) : (
                    weakness.result.behavior_patterns.map((p, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-white/5 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {p.pattern}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityBg[p.severity]} ${severityColor[p.severity]}`}
                          >
                            {p.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Risk Areas */}
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-orange-400" />
                    Risk Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.result.risk_areas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No risk areas identified.
                    </p>
                  ) : (
                    weakness.result.risk_areas.map((r, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-white/5 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{r.area}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityBg[r.risk_level]} ${severityColor[r.risk_level]}`}
                          >
                            {r.risk_level}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.detail}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Improvement Plan */}
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4 text-emerald-400" />
                    Improvement Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.result.improvement_plan.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No improvement plan generated yet.
                    </p>
                  ) : (
                    weakness.result.improvement_plan.map((s, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-white/5 p-3 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                            {s.step}
                          </span>
                          <span className="text-sm font-medium">{s.action}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-7">
                          → {s.expected_outcome}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Topic Accuracy Breakdown */}
            {weakness.stats.topicAccuracy.length > 0 && (
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-4 w-4 text-purple-400" />
                    Topic Accuracy Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakness.stats.topicAccuracy
                    .sort((a, b) => a.accuracy - b.accuracy)
                    .map((t, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            {t.topic}{" "}
                            <span className="text-xs text-muted-foreground">
                              ({t.solved}/{t.attempted})
                            </span>
                          </span>
                          <span className="font-medium">
                            {t.accuracy.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              t.accuracy >= 70
                                ? "bg-green-500"
                                : t.accuracy >= 40
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${Math.max(t.accuracy, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
