"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type RankingEntry = {
  rank?: number;
  userId: string;
  userName: string;
  score: number;
  solvedCount: number;
};

interface RankingBoardProps {
  contestId: string;
  rankings: RankingEntry[];
  isActive?: boolean;
  currentUserId?: string;
}

export function RankingBoard({
  contestId,
  rankings: initialRankings,
  isActive = false,
  currentUserId,
}: RankingBoardProps) {
  const [rankings, setRankings] = useState(initialRankings);
  const [expanded, setExpanded] = useState(false);

  // Keep in sync with parent prop updates
  useEffect(() => {
    setRankings(initialRankings);
  }, [initialRankings]);

  // Poll every 30s when contest is active
  const fetchRankings = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.rankings) setRankings(data.rankings);
      }
    } catch {
      // non-critical
    }
  }, [contestId]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(fetchRankings, 30_000);
    return () => clearInterval(interval);
  }, [isActive, fetchRankings]);

  // Assign ranks if not present
  const ranked = rankings.map((r, i) => ({ ...r, rank: r.rank ?? i + 1 }));

  return (
    <div className="bg-[#1f1f1f] border-[#2d2d2d]">
      {/* Compact header — click to toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#252525] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-foreground">Leaderboard</span>
          <span className="text-xs bg-[#2d2d2d] text-muted-foreground px-2 py-0.5 rounded-full">
            <Users className="inline h-3 w-3 mr-1" />
            {ranked.length}
          </span>
          {isActive && (
            <span className="text-[10px] text-emerald-400/70 font-medium ml-1">LIVE</span>
          )}
        </div>
        <span className="text-muted-foreground text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 overflow-auto max-h-64">
          {ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No submissions yet. Be the first to solve!
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2d2d2d] text-left text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium w-10">#</th>
                  <th className="py-1.5 pr-3 font-medium">User</th>
                  <th className="py-1.5 pr-3 font-medium text-right w-16">Score</th>
                  <th className="py-1.5 pr-3 font-medium text-right w-16">Solved</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r) => {
                  const isCurrentUser = currentUserId && r.userId === currentUserId;
                  return (
                    <tr
                      key={r.userId}
                      className={cn(
                        "border-b border-[#2d2d2d] last:border-0 transition-colors",
                        isCurrentUser
                          ? "bg-blue-500/10"
                          : "hover:bg-[#252525]"
                      )}
                    >
                      <td className="py-1.5 pr-3">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                            r.rank === 1 && "bg-yellow-500/20 text-yellow-400",
                            r.rank === 2 && "bg-gray-400/20 text-gray-300",
                            r.rank === 3 && "bg-orange-500/20 text-orange-400"
                          )}
                        >
                          {r.rank}
                        </span>
                      </td>
                      <td className={cn("py-1.5 pr-3 text-foreground", isCurrentUser && "font-semibold")}>
                        {r.userName}
                        {isCurrentUser && (
                          <span className="ml-1 text-blue-400 text-[10px]">(you)</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 font-mono text-right text-foreground">
                        {r.score}
                      </td>
                      <td className="py-1.5 pr-3 text-right text-muted-foreground">
                        {r.solvedCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
