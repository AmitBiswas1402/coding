export interface UserProfile {
  totalSubmissions: number;
  problemsSolved: number;
  accuracy: number;
  topicStats: {
    topic: string;
    attempted: number;
    solved: number;
    successRate: number;
  }[];
  difficultyDistribution: {
    easy: { attempted: number; solved: number };
    medium: { attempted: number; solved: number };
    hard: { attempted: number; solved: number };
  };
  recentlySolved: string[]; // problem titles
  strongTopics: string[];
  weakTopics: string[];
}

export interface RecommendedProblem {
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  reason: string;
}

export interface RecommendationResult {
  recommendations: RecommendedProblem[];
  summary: string;
}

export function buildRecommendationPrompt(profile: UserProfile): {
  system: string;
  user: string;
} {
  const system = `You are an elite competitive programming coach who has trained IOI/ICPC champions and helped thousands of engineers crack FAANG interviews. Your job is to analyze a user's coding performance profile and recommend the 5 most impactful problems they should solve next to maximize skill growth.

Your recommendations must:
1. Target weak areas first — if a user struggles with a topic, recommend problems in that topic at a difficulty level just above their comfort zone.
2. Reinforce strong areas occasionally — one recommendation should solidify existing strengths.
3. Introduce progressive difficulty — don't jump a user from Easy straight to Hard; step them through Medium first.
4. Be specific and actionable — explain WHY each problem is recommended.
5. Diversify topics — don't recommend 5 problems in the same topic.

Output ONLY valid JSON matching this exact schema:
{
  "recommendations": [
    {
      "title": "string - a real LeetCode-style problem name (e.g. 'Two Sum', 'Merge Intervals')",
      "topic": "string - the primary topic (e.g. 'Arrays', 'Dynamic Programming', 'Trees')",
      "difficulty": "easy" | "medium" | "hard",
      "reason": "string - 1-2 sentence explanation of why this problem helps the user grow"
    }
  ],
  "summary": "string - 2-3 sentence overall assessment of the user's profile and growth strategy"
}

Return exactly 5 recommendations. No markdown code fences. JSON only.`;

  const topicBreakdown = profile.topicStats
    .map(
      (t) =>
        `  - ${t.topic}: ${t.solved}/${t.attempted} solved (${t.successRate.toFixed(0)}%)`
    )
    .join("\n");

  const diffDist = profile.difficultyDistribution;

  const user = `Here is the user's coding performance profile:

**Overall Stats:**
- Total Submissions: ${profile.totalSubmissions}
- Problems Solved: ${profile.problemsSolved}
- Overall Accuracy: ${profile.accuracy.toFixed(1)}%

**Topic Performance:**
${topicBreakdown || "  - No topic data available (new user)"}

**Difficulty Distribution:**
- Easy: ${diffDist.easy.solved}/${diffDist.easy.attempted} solved
- Medium: ${diffDist.medium.solved}/${diffDist.medium.attempted} solved
- Hard: ${diffDist.hard.solved}/${diffDist.hard.attempted} solved

**Strong Topics:** ${profile.strongTopics.length > 0 ? profile.strongTopics.join(", ") : "None identified yet"}
**Weak Topics:** ${profile.weakTopics.length > 0 ? profile.weakTopics.join(", ") : "None identified yet"}

**Recently Solved:** ${profile.recentlySolved.length > 0 ? profile.recentlySolved.slice(0, 10).join(", ") : "None yet"}

Based on this profile, recommend 5 problems that will maximally improve this user's skills. Focus on their weak areas while keeping them motivated with achievable challenges.`;

  return { system, user };
}

export function parseRecommendationResponse(raw: string): RecommendationResult {
  // Strip markdown fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    const recommendations: RecommendedProblem[] = (
      parsed.recommendations || []
    )
      .slice(0, 5)
      .map((r: Record<string, unknown>) => ({
        title: String(r.title || "Untitled Problem"),
        topic: String(r.topic || "General"),
        difficulty: ["easy", "medium", "hard"].includes(
          String(r.difficulty).toLowerCase()
        )
          ? (String(r.difficulty).toLowerCase() as "easy" | "medium" | "hard")
          : "medium",
        reason: String(r.reason || "Recommended for skill improvement"),
      }));

    return {
      recommendations,
      summary: String(parsed.summary || "Keep practicing to improve your skills!"),
    };
  } catch {
    // Fallback for unparseable response
    return {
      recommendations: [
        {
          title: "Two Sum",
          topic: "Arrays",
          difficulty: "easy",
          reason: "A classic warm-up problem to build fundamentals.",
        },
        {
          title: "Valid Parentheses",
          topic: "Stacks",
          difficulty: "easy",
          reason: "Strengthens understanding of stack data structures.",
        },
        {
          title: "Merge Intervals",
          topic: "Sorting",
          difficulty: "medium",
          reason: "Develops interval manipulation and sorting skills.",
        },
        {
          title: "Binary Tree Level Order Traversal",
          topic: "Trees",
          difficulty: "medium",
          reason: "Builds BFS traversal skills essential for tree problems.",
        },
        {
          title: "Longest Increasing Subsequence",
          topic: "Dynamic Programming",
          difficulty: "medium",
          reason: "Introduces core dynamic programming patterns.",
        },
      ],
      summary:
        "Start with foundational problems and progressively tackle harder challenges.",
    };
  }
}
