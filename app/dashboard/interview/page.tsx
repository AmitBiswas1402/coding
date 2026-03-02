"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useInterviewStore } from "@/stores/interview-store";

const LEVELS = [
  { value: "SDE-1", label: "SDE-1", desc: "Junior · 0-2 years", icon: "🟢" },
  { value: "SDE-2", label: "SDE-2", desc: "Mid-level · 2-5 years", icon: "🟡" },
  { value: "SDE-3", label: "SDE-3", desc: "Senior · 5+ years", icon: "🔴" },
];

const CATEGORIES = [
  { value: "MNC", label: "MNC", desc: "Google, Amazon, Meta…", icon: "🏢" },
  { value: "Startup", label: "Startup", desc: "Fast-paced, scrappy", icon: "🚀" },
  { value: "Service Based", label: "Service Based", desc: "TCS, Infosys, Wipro…", icon: "🏗️" },
  { value: "Mixed", label: "Mixed", desc: "Balanced question mix", icon: "🎯" },
];

const TOPICS = [
  "Arrays",
  "Strings",
  "Linked Lists",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Recursion",
  "Sorting",
  "Binary Search",
  "Stack & Queue",
  "Hashing",
  "Greedy",
  "Mixed",
];

export default function InterviewPage() {
  const router = useRouter();
  const { status, setStatus, setConfig, setSession } = useInterviewStore();
  const [level, setLevel] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [topic, setTopic] = useState<string>("Mixed");

  const isGenerating = status === "generating";
  const canStart = level && category && !isGenerating;

  async function handleStart() {
    if (!canStart) return;
    setStatus("generating");
    setConfig(level, category, topic);

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, companyCategory: category, topic }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate question");
      }

      const data = await res.json();
      setSession(data.sessionId, data.question, data.endsAt);
      toast.success("Interview started! Good luck.");
      router.push(`/dashboard/interview/${data.sessionId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#1a1a1a] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Interview Mode</h1>
          <p className="text-zinc-400 mt-1">
            Simulate a real technical interview. Pick your level, company style, and topic — then solve
            under timed pressure with AI evaluation.
          </p>
        </div>

        {/* Level Selection */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">1. Experience Level</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                disabled={isGenerating}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  level === l.value
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-[#2d2d2d] bg-[#1f1f1f] hover:border-[#404040]"
                } disabled:opacity-50`}
              >
                <div className="text-2xl mb-1">{l.icon}</div>
                <div className="font-semibold">{l.label}</div>
                <div className="text-xs text-zinc-400">{l.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Company Category */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">2. Company Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                disabled={isGenerating}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  category === c.value
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-[#2d2d2d] bg-[#1f1f1f] hover:border-[#404040]"
                } disabled:opacity-50`}
              >
                <div className="text-2xl mb-1">{c.icon}</div>
                <div className="font-semibold text-sm">{c.label}</div>
                <div className="text-xs text-zinc-400">{c.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Topic Selection */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">3. Topic</h2>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                disabled={isGenerating}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  topic === t
                    ? "border-purple-500 bg-purple-500/15 text-purple-300"
                    : "border-[#2d2d2d] bg-[#1f1f1f] text-zinc-400 hover:border-[#404040] hover:text-zinc-200"
                } disabled:opacity-50`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Start Button */}
        <div className="pt-2">
          <Button
            size="lg"
            onClick={handleStart}
            disabled={!canStart}
            className="w-full sm:w-auto px-10 py-6 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Question…
              </span>
            ) : (
              "Start Interview"
            )}
          </Button>
          {!level && (
            <p className="text-xs text-zinc-500 mt-2">Select a level and company category to begin.</p>
          )}
        </div>
      </div>
    </div>
  );
}
