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

interface RaceLayoutProps {
  roomId: string;
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

  const userId = user?.id ?? "";
  const userName = user?.firstName ?? user?.username ?? "You";

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error("Failed to load room");
      const data = await res.json();
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
    if (!roomId || !userId || !roomCode || loading) return;
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
  }, [roomId, roomCode, userId, userName, loading, currentUserRole, setParticipants, setTimer, setStatus, setProblem, addActivity]);

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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
      toast.error("Submit failed");
    }
  };

  if (loading) return <div className="p-8">Loading room…</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
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
        <div className="text-xs">
          <span
            className={`rounded-full px-2 py-1 capitalize ${
              status === "running"
                ? "bg-emerald-500/20 text-emerald-300"
                : status === "waiting"
                ? "bg-amber-500/20 text-amber-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

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
