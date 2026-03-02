"use client";

import { cn } from "@/lib/utils";

interface PerformanceGraphProps {
  runtime: number;
  maxRuntime?: number;
  className?: string;
}

export function PerformanceGraph({ runtime, maxRuntime = 50, className }: PerformanceGraphProps) {
  // Generate distribution data (simulated)
  const bins = 10;
  const binSize = maxRuntime / bins;
  
  // Simulate distribution - most submissions are slower
  const distribution = Array.from({ length: bins }, (_, i) => {
    const binStart = i * binSize;
    const binEnd = (i + 1) * binSize;
    // More submissions in slower bins
    const baseHeight = Math.max(5, 40 - i * 3);
    const randomVariation = Math.random() * 10;
    return {
      start: binStart,
      end: binEnd,
      height: baseHeight + randomVariation,
      isUserBin: runtime >= binStart && runtime < binEnd,
    };
  });

  const maxHeight = Math.max(...distribution.map(d => d.height));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-xs text-muted-foreground mb-1">Runtime Distribution</div>
      <div className="flex items-end gap-1 h-24">
        {distribution.map((bin, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center relative group"
          >
            <div
              className={cn(
                "w-full rounded-t transition-all",
                bin.isUserBin
                  ? "bg-blue-500 border-2 border-blue-400"
                  : "bg-[#2d2d2d] hover:bg-[#3d3d3d]"
              )}
              style={{ height: `${(bin.height / maxHeight) * 100}%` }}
            />
            {bin.isUserBin && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-2 rounded-full bg-blue-400 border border-blue-300" />
              </div>
            )}
            <div className="text-[10px] text-muted-foreground mt-1">
              {idx === 0 ? "0" : idx === bins - 1 ? `${maxRuntime}` : ""}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0ms</span>
        <span>{maxRuntime}ms</span>
      </div>
    </div>
  );
}
