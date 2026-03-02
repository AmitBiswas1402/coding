"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateRacePage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ difficulty }) });
      const data = await res.json();
      if (data.roomId) router.push(`/dashboard/race/${data.roomId}`);
      else throw new Error(data.error || "Failed to create room");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create a Race Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Difficulty (sets timer)</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((d) => (
                <Button
                  key={d}
                  variant={difficulty === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDifficulty(d)}
                >
                  Level {d} ({d === 1 ? "30m" : d === 2 ? "45m" : "60m"})
                </Button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating…" : "Create Room"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
