export interface WeaknessAnalyticsInput {
  totalSolved: number;
  failedAttempts: number;
  avgTimeMinutes: number;
  topicAccuracy: { topic: string; accuracy: number; attempted: number; solved: number }[];
  retryStats: { avgRetries: number; maxRetries: number; mostRetriedTopic: string };
  abandonRate: number;
  totalProblemsAttempted: number;
}

export interface WeaknessAnalyticsResult {
  weak_topics: { topic: string; accuracy: number; suggestion: string }[];
  behavior_patterns: { pattern: string; severity: "low" | "medium" | "high"; description: string }[];
  risk_areas: { area: string; risk_level: "low" | "medium" | "high"; detail: string }[];
  improvement_plan: { step: number; action: string; expected_outcome: string }[];
  confidence_score: number;
}

export function buildWeaknessAnalyticsPrompt(input: WeaknessAnalyticsInput): {
  system: string;
  user: string;
} {
  const system = `You are a senior competitive programming coach and data analyst. 
Your task is to deeply analyze a coder's performance data and identify:

1. **Weak Topics** — Topics where the user consistently fails or has low accuracy. For each weak topic, provide a targeted suggestion.
2. **Behavior Patterns** — Detect behavioral patterns such as:
   - "Gives up too quickly" (high abandon rate)
   - "Brute-force mindset" (many retries, low first-attempt success)
   - "Avoids hard problems" (no attempts on difficulty 3)
   - "Inconsistent practice" (large gaps between submission timestamps)
   - "Over-reliance on one topic" 
3. **Risk Areas** — Areas where the user might plateau or develop bad habits.
4. **Improvement Plan** — A numbered step-by-step plan to improve, ordered by priority.
5. **Confidence Score** — A 0-100 confidence score in your analysis based on the amount and quality of available data.

Be brutally honest but constructive. Every insight must be data-backed.
If there's limited data, lower your confidence score and say so in the patterns.

Output ONLY valid JSON matching this exact schema:
{
  "weak_topics": [{ "topic": "string", "accuracy": number, "suggestion": "string" }],
  "behavior_patterns": [{ "pattern": "string", "severity": "low|medium|high", "description": "string" }],
  "risk_areas": [{ "area": "string", "risk_level": "low|medium|high", "detail": "string" }],
  "improvement_plan": [{ "step": number, "action": "string", "expected_outcome": "string" }],
  "confidence_score": number
}

No markdown code fences. JSON only.`;

  const topicBreakdown = input.topicAccuracy
    .map(
      (t) =>
        `  - ${t.topic}: ${t.solved}/${t.attempted} solved (${t.accuracy.toFixed(1)}% accuracy)`
    )
    .join("\n");

  const user = `Here is the user's performance data:

**Overview:**
- Total Problems Attempted: ${input.totalProblemsAttempted}
- Problems Solved: ${input.totalSolved}
- Failed Attempts: ${input.failedAttempts}
- Abandon Rate: ${(input.abandonRate * 100).toFixed(1)}% (problems attempted but never solved)
- Average Time Between Submissions: ${input.avgTimeMinutes.toFixed(1)} minutes

**Topic Accuracy:**
${topicBreakdown || "  - No topic data available"}

**Retry Behavior:**
- Average Retries per Problem: ${input.retryStats.avgRetries.toFixed(1)}
- Maximum Retries on a Single Problem: ${input.retryStats.maxRetries}
- Most Retried Topic: ${input.retryStats.mostRetriedTopic || "N/A"}

Analyze this data and provide a comprehensive weakness report.`;

  return { system, user };
}

export function parseWeaknessAnalyticsResponse(raw: string): WeaknessAnalyticsResult {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    const weak_topics = (parsed.weak_topics || []).map(
      (t: Record<string, unknown>) => ({
        topic: String(t.topic || "Unknown"),
        accuracy: Number(t.accuracy) || 0,
        suggestion: String(t.suggestion || "Practice more problems in this topic."),
      })
    );

    const behavior_patterns = (parsed.behavior_patterns || []).map(
      (p: Record<string, unknown>) => ({
        pattern: String(p.pattern || "Unknown pattern"),
        severity: (["low", "medium", "high"].includes(String(p.severity))
          ? String(p.severity)
          : "medium") as "low" | "medium" | "high",
        description: String(p.description || ""),
      })
    );

    const risk_areas = (parsed.risk_areas || []).map(
      (r: Record<string, unknown>) => ({
        area: String(r.area || "Unknown"),
        risk_level: (["low", "medium", "high"].includes(String(r.risk_level))
          ? String(r.risk_level)
          : "medium") as "low" | "medium" | "high",
        detail: String(r.detail || ""),
      })
    );

    const improvement_plan = (parsed.improvement_plan || []).map(
      (s: Record<string, unknown>, i: number) => ({
        step: Number(s.step) || i + 1,
        action: String(s.action || ""),
        expected_outcome: String(s.expected_outcome || ""),
      })
    );

    const confidence_score = Math.min(
      100,
      Math.max(0, Number(parsed.confidence_score) || 50)
    );

    return { weak_topics, behavior_patterns, risk_areas, improvement_plan, confidence_score };
  } catch {
    return {
      weak_topics: [],
      behavior_patterns: [
        {
          pattern: "Insufficient Data",
          severity: "low",
          description:
            "Not enough submission data to perform a reliable analysis. Keep solving!",
        },
      ],
      risk_areas: [],
      improvement_plan: [
        {
          step: 1,
          action: "Solve at least 10 problems across different topics",
          expected_outcome: "Enough data for a meaningful weakness analysis",
        },
      ],
      confidence_score: 10,
    };
  }
}
