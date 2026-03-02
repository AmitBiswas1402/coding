"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Contest = {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  endsAt: string;
};

export default function ContestListPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    fetch("/api/contests")
      .then((r) => r.json())
      .then((data) => setContests(Array.isArray(data) ? data : []))
      .catch(() => setContests([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Contest title is required");
      return;
    }
    setCreating(true);
    try {
      const startsAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), startsAt, endsAt }),
      });
      const data = await res.json();
      if (data.id) {
        setContests((c) => [data, ...c]);
        setTitle("");
        toast.success("Contest created!");
      } else {
        toast.error(data.error ?? "Failed to create contest");
      }
    } catch {
      toast.error("Failed to create contest");
    } finally {
      setCreating(false);
    }
  }

  function getStatus(c: Contest) {
    const now = Date.now();
    const start = new Date(c.startsAt).getTime();
    const end = new Date(c.endsAt).getTime();
    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "active";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contests</h1>
          <p className="text-sm text-muted-foreground">
            Create and join timed contests with rankings and scores.
          </p>
        </div>
      </div>
      <Card className="mb-2">
        <CardHeader>
          <CardTitle>Create Contest</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Title</label>
            <Input
              placeholder="Weekly Challenge #1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-60"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Duration (min)</label>
            <select
              className="h-10 rounded-md border px-3 text-sm"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Create"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && contests.length === 0 && (
            <p className="text-sm text-muted-foreground">No contests yet. Create one above.</p>
          )}
          {!loading && contests.length > 0 && (
            <ul className="space-y-2">
              {contests.map((c) => {
                const status = getStatus(c);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/contest/${c.id}`}
                      className="flex items-center justify-between p-3 rounded hover:bg-muted border"
                    >
                      <div>
                        <span className="font-medium">{c.title}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(c.startsAt).toLocaleString()} — {new Date(c.endsAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          status === "active"
                            ? "bg-green-500/20 text-green-700"
                            : status === "upcoming"
                            ? "bg-blue-500/20 text-blue-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {status}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
