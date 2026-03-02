"use client";

import type { Problem } from "@/stores/race-store";

interface ProblemPanelProps {
  problem: Problem | null;
}

export function ProblemPanel({ problem }: ProblemPanelProps) {
  if (!problem) {
    return (
      <div className="p-4 text-muted-foreground">
        Waiting for race to start. The host will choose a problem.
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <h2 className="text-xl font-semibold mb-2">{problem.title}</h2>
      {problem.topic && (
        <span className="text-xs text-muted-foreground">Topic: {problem.topic}</span>
      )}
      <div className="prose prose-sm dark:prose-invert mt-4 max-w-none">
        <div dangerouslySetInnerHTML={{ __html: problem.statement }} />
      </div>
      {problem.constraints && (
        <div className="mt-4">
          <h3 className="font-medium text-sm">Constraints</h3>
          <pre className="text-xs whitespace-pre-wrap mt-1">{problem.constraints}</pre>
        </div>
      )}
      {problem.inputFormat && (
        <div className="mt-4">
          <h3 className="font-medium text-sm">Input format</h3>
          <pre className="text-xs whitespace-pre-wrap mt-1">{problem.inputFormat}</pre>
        </div>
      )}
      {problem.outputFormat && (
        <div className="mt-4">
          <h3 className="font-medium text-sm">Output format</h3>
          <pre className="text-xs whitespace-pre-wrap mt-1">{problem.outputFormat}</pre>
        </div>
      )}
    </div>
  );
}
