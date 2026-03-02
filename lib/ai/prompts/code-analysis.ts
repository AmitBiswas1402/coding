export interface AiEvaluationResult {
  correctness_score: number;
  time_complexity: string;
  space_complexity: string;
  optimization_score: number;
  readability_score: number;
  edge_case_handling_score: number;
  issues: string[];
  improvement_suggestions: string[];
  overall_feedback: string;
}

export function buildCodeEvaluationPrompt(
  code: string,
  problemStatement: string,
  constraints: string | null,
  language: string
): { system: string; user: string } {
  const system = `You are a senior FAANG-level coding interviewer and code reviewer.

Your task is to evaluate a candidate's solution.

Be strict but fair.

Return ONLY valid JSON.
Do not include explanations outside JSON.
Do not wrap the JSON in markdown code fences.

Evaluate the solution and return JSON in this EXACT format:

{
  "correctness_score": number (0-100),
  "time_complexity": "Big-O notation",
  "space_complexity": "Big-O notation",
  "optimization_score": number (0-100),
  "readability_score": number (0-100),
  "edge_case_handling_score": number (0-100),
  "issues": ["list of issues found"],
  "improvement_suggestions": ["list of improvements"],
  "overall_feedback": "short structured feedback paragraph"
}`;

  const user = `Problem:
${problemStatement}

${constraints ? `Constraints:\n${constraints}\n` : ""}
Candidate Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Evaluate this solution now.`;

  return { system, user };
}

/**
 * Parse LLM response into structured evaluation, stripping markdown fences if present.
 */
export function parseEvaluationResponse(raw: string): AiEvaluationResult {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);

  // Validate and clamp scores
  const clamp = (v: unknown, fallback: number) => {
    const n = typeof v === "number" ? v : Number(v);
    if (isNaN(n)) return fallback;
    return Math.max(0, Math.min(100, Math.round(n)));
  };

  return {
    correctness_score: clamp(parsed.correctness_score, 0),
    time_complexity: String(parsed.time_complexity || "Unknown"),
    space_complexity: String(parsed.space_complexity || "Unknown"),
    optimization_score: clamp(parsed.optimization_score, 0),
    readability_score: clamp(parsed.readability_score, 0),
    edge_case_handling_score: clamp(parsed.edge_case_handling_score, 0),
    issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
    improvement_suggestions: Array.isArray(parsed.improvement_suggestions)
      ? parsed.improvement_suggestions.map(String)
      : [],
    overall_feedback: String(parsed.overall_feedback || "No feedback provided."),
  };
}
