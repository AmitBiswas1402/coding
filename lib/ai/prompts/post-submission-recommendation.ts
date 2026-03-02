export interface PostSubmitContext {
  problemTitle: string;
  problemTopic: string;
  problemDifficulty: "Easy" | "Medium" | "Hard";
  correctnessScore: number;
  timeComplexity: string;
  spaceComplexity: string;
  optimizationScore: number;
  readabilityScore: number;
  edgeCaseScore: number;
  retryCount: number;
  weakTopics: string[];
  strongTopics: string[];
  avgAccuracy: number;
}

export interface PostSubmitRecommendation {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  focus_area: string;
  reason: string;
}

export interface PostSubmitRecommendationResult {
  recommendations: PostSubmitRecommendation[];
}

export function buildPostSubmitRecommendationPrompt(ctx: PostSubmitContext): {
  system: string;
  user: string;
} {
  const system = `You are an adaptive coding recommendation engine.

You MUST return exactly 2-3 problem recommendations.

Rules:
- Return ONLY valid JSON.
- Do NOT include markdown.
- Do NOT include explanations outside JSON.
- Do NOT return fewer than 2 or more than 3 problems.
- If unsure, still return exactly 2.

Each recommendation must:
- Target a specific weakness
- Follow difficulty progression logic
- Be realistic and interview-relevant

Recommendation Rules:
- If correctness < 60 → include easier reinforcement problems.
- If correctness 60–85 → include same difficulty strengthening problems.
- If correctness > 85 → include 2 harder escalation problems.
- Prioritize weak topics.
- Include at least 1 problem targeting optimization or complexity improvement.
- Ensure mix of reinforcement + progression.
- Use real well-known LeetCode-style problem names.

Return recommendations in this JSON format:

{
  "recommendations": [
    {
      "title": "",
      "difficulty": "Easy/Medium/Hard",
      "topic": "",
      "focus_area": "",
      "reason": ""
    }
  ]
}`;

  const user = `The user has just submitted a coding problem.

Problem Attempted:
Title: ${ctx.problemTitle}
Topic: ${ctx.problemTopic}
Difficulty: ${ctx.problemDifficulty}

Evaluation Results:
Correctness Score: ${ctx.correctnessScore}
Time Complexity: ${ctx.timeComplexity}
Space Complexity: ${ctx.spaceComplexity}
Optimization Score: ${ctx.optimizationScore}
Readability Score: ${ctx.readabilityScore}
Edge Case Handling Score: ${ctx.edgeCaseScore}
Retries: ${ctx.retryCount}

User Overall Stats:
Weak Topics: ${ctx.weakTopics.length > 0 ? ctx.weakTopics.join(", ") : "None identified yet"}
Strong Topics: ${ctx.strongTopics.length > 0 ? ctx.strongTopics.join(", ") : "None identified yet"}
Average Accuracy: ${ctx.avgAccuracy.toFixed(1)}%

Based on these evaluation results and user stats, recommend 2-3 problems that directly address the weaknesses revealed in this submission.`;

  return { system, user };
}

export function parsePostSubmitRecommendationResponse(
  raw: string
): PostSubmitRecommendationResult {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    const recommendations: PostSubmitRecommendation[] = (
      parsed.recommendations || []
    )
      .slice(0, 3)
      .map((r: Record<string, unknown>) => ({
        title: String(r.title || "Untitled Problem"),
        difficulty: (["Easy", "Medium", "Hard"].includes(String(r.difficulty))
          ? String(r.difficulty)
          : "Medium") as "Easy" | "Medium" | "Hard",
        topic: String(r.topic || "General"),
        focus_area: String(r.focus_area || "General Practice"),
        reason: String(r.reason || "Recommended to improve your skills."),
      }));

    return { recommendations };
  } catch {
    return {
      recommendations: [
        {
          title: "Two Sum",
          difficulty: "Easy",
          topic: "Arrays",
          focus_area: "Hash Map Optimization",
          reason: "Build fundamental hash map intuition for O(n) solutions.",
        },
        {
          title: "Merge Intervals",
          difficulty: "Medium",
          topic: "Sorting",
          focus_area: "Edge Case Handling",
          reason:
            "Strengthens sorting-based approaches and boundary management.",
        },
      ],
    };
  }
}
