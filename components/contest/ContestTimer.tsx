"use client";

import { useEffect, useState } from "react";

interface ContestTimerProps {
  contestId: string;
  endsAt?: string | null;
  onEnd?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ContestTimer({ contestId, endsAt = null, onEnd }: ContestTimerProps) {
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
  if (remaining <= 0) return <div className="font-mono text-destructive">00:00 — Contest ended</div>;

  return (
    <div className="font-mono text-xl font-semibold tabular-nums">
      Time left: {formatTime(remaining)}
    </div>
  );
}
