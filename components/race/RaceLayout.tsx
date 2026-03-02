"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket/client";
import { useRaceStore, type Problem as RaceProblem } from "@/stores/race-store";
import { RaceTimer } from "./RaceTimer";
import { ProblemPanel } from "./ProblemPanel";
import { EditorPanel } from "./EditorPanel";
import { ParticipantsList } from "./ParticipantsList";
import { ActivityFeed } from "./ActivityFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Copy,
  Check,
  Trophy,
  Brain,
  Users,
  AlertTriangle,
  Loader2,
  Shield,
  Zap,
  Target,
} from "lucide-react";

interface RaceLayoutProps {
  roomId: string;
}

interface RaceRanking {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  feedback: string;
}

interface BehavioralInsight {
  pattern: string;
  description: string;
  participants: string[];
}

interface RaceFeedback {
  result: {
    rankings: RaceRanking[];
    behavioral_analysis: BehavioralInsight[];
    overall_summary: string;
  };
}

export function RaceLayout({ roomId }: RaceLayoutProps) {
  const { user } = useUser();
  const {
    roomCode,
    participants,
    problem,
    status,
    endsAt,
    currentUserRole,
    activityLog,
    setRoom,
    setProblem,
    setParticipants,
    setTimer,
    addActivity,
    setStatus,
    setRole,
    reset,
  } = useRaceStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomFull, setRoomFull] = useState(false);
  const [copied, setCopied] = useState(false);

  // Post-race feedback state
  const [raceFeedback, setRaceFeedback] = useState<RaceFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const userId = user?.id ?? "";
  const userName = user?.firstName ?? user?.username ?? "You";

  const shareableLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/race/${roomId}`
      : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error("Failed to load room");
      const data = await res.json();

      // Handle room full
      if (data.roomFull) {
        setRoomFull(true);
        setLoading(false);
        return;
      }

      setRoom(roomId, data.roomCode);
      setStatus(data.status);
      setParticipants(
        (data.participants ?? []).map((p: { id: string; name?: string | null }) => ({
          userId: p.id,
          userName: p.name ?? "User",
        }))
      );
      if (data.endsAt) setTimer(data.endsAt);
      if (data.problem) {
        setProblem({
          id: data.problem.id,
          title: data.problem.title,
          statement: data.problem.statement,
          constraints: data.problem.constraints,
          inputFormat: data.problem.inputFormat,
          outputFormat: data.problem.outputFormat,
          difficulty: data.problem.difficulty,
          topic: data.problem.topic,
        });
      }
      if (data.isHost) setRole("host");
      else setRole("participant");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load room");
    } finally {
      setLoading(false);
    }
  }, [roomId, userId, setRoom, setStatus, setParticipants, setTimer, setProblem, setRole]);

  useEffect(() => {
    fetchRoom();
    return () => reset();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !userId || !roomCode || loading || roomFull) return;
    const socket = getSocket({ userId, userName });
    if (currentUserRole === "host") {
      socket.emit("create_room", {
        roomId,
        roomCode,
        difficulty: 1,
      });
    } else {
      socket.emit("join_room", { roomId, roomCode });
    }

    socket.on("joined_room", (payload: { roomId: string; participants: { userId: string; userName: string }[] }) => {
      setParticipants(payload.participants);
    });

    socket.on("timer_sync", (payload: { remainingSeconds: number; endsAt: string }) => {
      setTimer(payload.endsAt);
    });

    socket.on("race_started", (payload: { roomId: string; problem: RaceProblem | null; difficulty: number }) => {
      setStatus("running");
      if (payload.problem) setProblem(payload.problem);
    });

    socket.on("user_ran_code", (payload: { userId: string; userName: string }) => {
      if (payload.userId !== userId) {
        toast.info(`${payload.userName} ran the code`);
        addActivity({ type: "run", ...payload, at: Date.now() });
      }
    });

    socket.on("user_submitted", (payload: { userId: string; userName: string }) => {
      if (payload.userId !== userId) {
        toast.info(`${payload.userName} submitted solution`);
        addActivity({ type: "submit", ...payload, at: Date.now() });
      }
    });

    socket.on("user_solved", (payload: { userId: string; userName: string }) => {
      toast.success(`${payload.userName} solved the problem!`);
      addActivity({ type: "solved", ...payload, at: Date.now() });
    });

    socket.on("race_end", () => {
      setStatus("finished");
      toast("Race ended!");
    });

    socket.on("room_full", () => {
      toast.error("Room is full");
      setRoomFull(true);
    });

    return () => {
      socket.off("joined_room");
      socket.off("timer_sync");
      socket.off("race_started");
      socket.off("user_ran_code");
      socket.off("user_submitted");
      socket.off("user_solved");
      socket.off("race_end");
      socket.off("room_full");
    };
  }, [roomId, roomCode, userId, userName, loading, roomFull, currentUserRole, setParticipants, setTimer, setStatus, setProblem, addActivity]);

  const handleStartRace = async () => {
    if (currentUserRole !== "host" || !roomId) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.problem) {
        const socket = getSocket({ userId, userName });
        socket.emit("start_race", {
          roomId,
          problem: data.problem,
          difficulty: data.difficulty,
        });
      }
    } catch {
      toast.error("Failed to start race");
    }
  };

  const handleRun = async (code: string, language: string) => {
    if (!problem?.id) return;
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, code, language }),
      });
      const data = await res.json();
      if (data.ok !== false) {
        const socket = getSocket({ userId, userName });
        socket.emit("run_code", { roomId });
      }
      toast(data.message ?? (data.accepted ? "Run passed" : "Run completed"));
    } catch {
      toast.error("Run failed");
    }
  };

  const handleSubmit = async (code: string, language: string) => {
    if (!problem?.id) return;
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, code, language, roomId }),
      });
      const data = await res.json();
      const socket = getSocket({ userId, userName });
      if (data.status === "accepted") {
        socket.emit("user_solved", { roomId });
      }
      socket.emit("submit_code", { roomId });
      toast(data.message ?? (data.status === "accepted" ? "Accepted!" : "Submission received"));
    } catch {
      toast.error("Submit failed");
    }
  };

  const fetchRaceFeedback = async () => {
    setFeedbackLoading(true);
    try {
      // Derive per-user stats from activityLog
      const statsMap = new Map<string, { runs: number; submits: number; solved: boolean; solvedAt: number | null }>();
      for (const item of activityLog) {
        if (!statsMap.has(item.userId)) {
          statsMap.set(item.userId, { runs: 0, submits: 0, solved: false, solvedAt: null });
        }
        const s = statsMap.get(item.userId)!;
        if (item.type === "run") s.runs++;
        if (item.type === "submit") s.submits++;
        if (item.type === "solved" && !s.solved) {
          s.solved = true;
          s.solvedAt = item.at;
        }
      }

      const participantStats = participants.map((p) => {
        const s = statsMap.get(p.userId);
        return {
          userId: p.userId,
          userName: p.userName,
          solved: s?.solved ?? false,
          submissionCount: s?.submits ?? 0,
          runCount: s?.runs ?? 0,
          solvedAtMs: s?.solvedAt ?? null,
        };
      });

      const res = await fetch("/api/ai/race-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, participantStats }),
      });
      if (!res.ok) throw new Error("Failed");
      const data: RaceFeedback = await res.json();
      setRaceFeedback(data);
    } catch {
      toast.error("Failed to generate race feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  // ─── Loading state ───
  if (loading) return <div className="p-8">Loading room…</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;

  // ─── Room Full state ───
  if (roomFull) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Card className="max-w-md w-full border-red-500/30 bg-red-500/5">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 mb-4">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <CardTitle className="text-xl">Room Full</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-muted-foreground">
              This room already has 4 participants. You cannot join at this time.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Post-race results overlay ───
  if (status === "finished" && raceFeedback) {
    const { rankings, behavioral_analysis, overall_summary } = raceFeedback.result;
    return (
      <div className="space-y-6 p-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-amber-400" />
            <h1 className="text-2xl font-bold">Race Results</h1>
          </div>
          <p className="text-muted-foreground">{overall_summary}</p>
        </div>

        {/* Rankings */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings.map((r) => (
                <div
                  key={r.userId}
                  className="flex items-center gap-4 rounded-lg bg-white/5 p-3"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      r.rank === 1
                        ? "bg-amber-500/30 text-amber-300"
                        : r.rank === 2
                          ? "bg-gray-400/30 text-gray-300"
                          : r.rank === 3
                            ? "bg-orange-500/30 text-orange-300"
                            : "bg-white/10 text-muted-foreground"
                    }`}
                  >
                    #{r.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{r.userName}</span>
                      <span className="text-lg font-bold text-primary">
                        {r.score}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.feedback}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Behavioral Analysis */}
        {behavioral_analysis.length > 0 && (
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                Behavioral Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {behavioral_analysis.map((b, i) => (
                <div key={i} className="rounded-lg bg-white/5 p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-sm">{b.pattern}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.description}
                  </p>
                  <p className="text-xs text-purple-400">
                    {b.participants.join(", ")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => setRaceFeedback(null)}>
            Back to Race View
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/dashboard/race/create"}>
            New Race
          </Button>
        </div>
      </div>
    );
  }

  // ─── Main race layout ───
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b bg-card/60 px-4 py-2">
        <div className="text-xs text-muted-foreground">
          {roomCode && (
            <div className="font-medium text-foreground">
              Room <span className="font-mono">{roomCode}</span>
            </div>
          )}
          {problem && (
            <div>
              {problem.topic && <span>{problem.topic} · </span>}
              <span>Level {problem.difficulty}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Time left
          </span>
          <RaceTimer endsAt={endsAt} />
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2 py-1 text-xs capitalize ${
              status === "running"
                ? "bg-emerald-500/20 text-emerald-300"
                : status === "waiting"
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {status}
          </span>
          {status === "finished" && (
            <Button
              size="sm"
              onClick={fetchRaceFeedback}
              disabled={feedbackLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {feedbackLoading ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Trophy className="mr-1 h-3 w-3" />
                  View Results
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Share Link Bar (waiting state) */}
      {status === "waiting" && (
        <div className="flex items-center gap-3 border-b bg-purple-500/5 px-4 py-2">
          <Users className="h-4 w-4 text-purple-400" />
          <span className="text-sm text-muted-foreground">Share this link to invite players:</span>
          <code className="flex-1 truncate rounded bg-white/5 px-2 py-1 text-xs font-mono text-purple-300">
            {shareableLink}
          </code>
          <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
            {copied ? (
              <>
                <Check className="mr-1 h-3 w-3 text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Copy Link
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {participants.length}/4
          </span>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 mt-4">
        <div className="col-span-3 border rounded-lg overflow-hidden flex flex-col bg-card">
          <div className="p-2 border-b font-medium text-sm">Problem</div>
          <div className="flex-1 overflow-auto">
            <ProblemPanel problem={problem} />
          </div>
        </div>

        <div className="col-span-6 flex flex-col min-h-0">
          {currentUserRole === "host" && status === "waiting" && (
            <Button className="mb-2 self-start" onClick={handleStartRace}>
              <Target className="mr-2 h-4 w-4" />
              Start Race
            </Button>
          )}
          <EditorPanel
            problemId={problem?.id ?? null}
            roomId={roomId}
            onRun={handleRun}
            onSubmit={handleSubmit}
            disabled={status === "finished"}
          />
        </div>

        <div className="col-span-3 border rounded-lg flex flex-col bg-card">
          <ParticipantsList participants={participants} />
          <div className="border-t" />
          <ActivityFeed items={activityLog} />
        </div>
      </div>
    </div>
  );
}
