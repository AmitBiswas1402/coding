"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RankingEntry = {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  solvedCount: number;
};

interface RankingBoardProps {
  contestId: string;
  rankings: RankingEntry[];
}

export function RankingBoard({ contestId, rankings }: RankingBoardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet. Be the first to solve!</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">#</th>
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Solved</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r) => (
                  <tr key={r.userId} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          r.rank === 1
                            ? "bg-yellow-500/20 text-yellow-700"
                            : r.rank === 2
                            ? "bg-gray-400/20 text-gray-700"
                            : r.rank === 3
                            ? "bg-orange-500/20 text-orange-700"
                            : ""
                        }`}
                      >
                        {r.rank}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{r.userName}</td>
                    <td className="py-2 pr-4 font-mono">{r.score}</td>
                    <td className="py-2 pr-4">{r.solvedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
