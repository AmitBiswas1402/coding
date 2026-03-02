"use client";

import { useEffect, useState } from "react";

interface RaceTimerProps {
  endsAt: string | null;
  onEnd?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function RaceTimer({ endsAt, onEnd }: RaceTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

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
      if (r <= 0 && onEnd) onEnd();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onEnd]);

  if (remaining === null) return <div className="text-muted-foreground">--:--</div>;
  if (remaining <= 0) return <div className="font-mono text-destructive">00:00 — Time&apos;s up!</div>;

  return (
    <div className="font-mono text-lg font-semibold tabular-nums">
      {formatTime(remaining)}
    </div>
  );
}
