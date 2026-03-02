export interface InterviewQuestion {
  title: string;
  description: string;
  constraints: string;
  examples: { input: string; output: string; explanation: string }[];
  difficulty_level: string;
  expected_time_minutes: number;
  hints: string[];
}

export function buildInterviewQuestionPrompt(params: {
  level: string;
  companyCategory: string;
  topic: string;
}): { system: string; user: string } {
  const { level, companyCategory, topic } = params;

  const system = `You are a FAANG-level technical interviewer.

Generate a realistic coding interview question.

Rules:
- Match requested level difficulty.
- Match requested company style.
- Ensure question is original.
- Return only valid JSON.
- Do not include markdown.`;

  const user = `Interview Level: ${level}
Company Category: ${companyCategory}
Topic: ${topic}

Return JSON:

{
  "title": "",
  "description": "",
  "constraints": "",
  "examples": [
    {
      "input": "",
      "output": "",
      "explanation": ""
    }
  ],
  "difficulty_level": "",
  "expected_time_minutes": number,
  "hints": []
}`;

  return { system, user };
}

export function parseInterviewQuestion(raw: string): InterviewQuestion {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed.title || !parsed.description) {
    throw new Error("Invalid question: missing title or description");
  }

  return {
    title: String(parsed.title),
    description: String(parsed.description),
    constraints: String(parsed.constraints || ""),
    examples: Array.isArray(parsed.examples)
      ? parsed.examples.map((e: Record<string, unknown>) => ({
          input: String(e.input ?? ""),
          output: String(e.output ?? ""),
          explanation: String(e.explanation ?? ""),
        }))
      : [],
    difficulty_level: String(parsed.difficulty_level || parsed.difficulty || "Medium"),
    expected_time_minutes: Math.max(5, Math.min(90, Number(parsed.expected_time_minutes) || 30)),
    hints: Array.isArray(parsed.hints) ? parsed.hints.map(String) : [],
  };
}
