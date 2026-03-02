"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface InterviewTimerProps {
  endsAt?: string | null;
  onEnd?: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function InterviewTimer({ endsAt = null, onEnd }: InterviewTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(null);
      return;
    }
    const ends = new Date(endsAt).getTime();
    const tick = () => {
      const now = Date.now();
      const r = Math.max(0, Math.floor((ends - now) / 1000));
      setRemaining(r);
      if (r <= 0 && !ended) {
        setEnded(true);
        onEnd?.();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt, ended, onEnd]);

  if (remaining === null) return <div className="text-muted-foreground">--:--</div>;

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-400">
        Time Up
      </span>
    );
  }

  const isUrgent = remaining <= 300;

  return (
    <span
      className={cn(
        "font-mono text-xl font-semibold tabular-nums",
        isUrgent && "text-red-500 animate-pulse"
      )}
    >
      {formatTime(remaining)}
    </span>
  );
}
