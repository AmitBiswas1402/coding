export interface InterviewScores {
  technical_score: number;
  problem_solving_score: number;
  optimization_score: number;
  code_quality_score: number;
  communication_score: number;
  time_management_score: number;
  hire_recommendation: string;
  strengths: string[];
  weaknesses: string[];
  detailed_feedback: string;
}

export function buildInterviewEvaluationPrompt(params: {
  question: string;
  code: string;
  solveTimeMinutes: number;
  runAttempts: number;
}): { system: string; user: string } {
  const { question, code, solveTimeMinutes, runAttempts } = params;

  const system = `You are evaluating a technical coding interview performance.

Be strict and realistic.
Return ONLY valid JSON.
Do not include markdown.`;

  const user = `Interview Question:
${question}

Candidate Code:
${code}

Solve Time (minutes): ${solveTimeMinutes}
Number of Attempts: ${runAttempts}

Return:

{
  "technical_score": number (0-100),
  "problem_solving_score": number (0-100),
  "optimization_score": number (0-100),
  "code_quality_score": number (0-100),
  "communication_score": number (0-100),
  "time_management_score": number (0-100),
  "hire_recommendation": "Strong Hire / Hire / Lean Hire / No Hire",
  "strengths": [],
  "weaknesses": [],
  "detailed_feedback": ""
}`;

  return { system, user };
}

const VALID_RECOMMENDATIONS = ["Strong Hire", "Hire", "Lean Hire", "No Hire"];

export function parseInterviewEvaluation(raw: string): InterviewScores {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);

  const clamp = (v: unknown, fallback: number) => {
    const n = typeof v === "number" ? v : Number(v);
    if (isNaN(n)) return fallback;
    return Math.max(0, Math.min(100, Math.round(n)));
  };

  let recommendation = String(parsed.hire_recommendation || "No Hire").trim();
  if (!VALID_RECOMMENDATIONS.includes(recommendation)) {
    // Try fuzzy match
    const lower = recommendation.toLowerCase();
    if (lower.includes("strong")) recommendation = "Strong Hire";
    else if (lower.includes("lean") || lower.includes("maybe")) recommendation = "Lean Hire";
    else if (lower.includes("hire") && !lower.includes("no")) recommendation = "Hire";
    else recommendation = "No Hire";
  }

  return {
    technical_score: clamp(parsed.technical_score, 0),
    problem_solving_score: clamp(parsed.problem_solving_score, 0),
    optimization_score: clamp(parsed.optimization_score, 0),
    code_quality_score: clamp(parsed.code_quality_score, 0),
    communication_score: clamp(parsed.communication_score, 0),
    time_management_score: clamp(parsed.time_management_score, 0),
    hire_recommendation: recommendation,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
    detailed_feedback: String(parsed.detailed_feedback || "No feedback provided."),
  };
}
