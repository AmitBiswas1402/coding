"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAnalyticsStore } from "@/stores/analytics-store";

export default function AnalyticsPage() {
  const { submissionsByDay, problemsSolved, accuracy, streak, setStats } =
    useAnalyticsStore();
  const loaded = submissionsByDay.length > 0 || problemsSolved > 0;

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your progress over time across problems, races, and contests.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
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
    </div>
  );
}
