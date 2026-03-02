export interface RaceParticipantData {
  userId: string;
  userName: string;
  solved: boolean;
  submissionCount: number;
  runCount: number;
  solvedAtMs: number | null;
  language?: string;
}

export interface RaceFeedbackInput {
  roomId: string;
  problemTitle: string;
  problemTopic: string;
  difficulty: number;
  durationMinutes: number;
  participants: RaceParticipantData[];
}

export interface RaceRanking {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  feedback: string;
}

export interface BehavioralInsight {
  pattern: string;
  description: string;
  participants: string[];
}

export interface RaceFeedbackResult {
  rankings: RaceRanking[];
  behavioral_analysis: BehavioralInsight[];
  overall_summary: string;
}

export function buildRaceFeedbackPrompt(input: RaceFeedbackInput): {
  system: string;
  user: string;
} {
  const system = `You are an elite competitive programming judge and behavioral analyst.
After a coding race, you receive each participant's stats and must produce:

1. **Rankings** — Rank all participants by performance. Scoring criteria:
   - Solved the problem: +50 points base
   - Speed bonus: faster solve = higher score (up to +30 points)
   - Efficiency: fewer submissions = better (penalize excessive submits)
   - Attempt effort: partial credit for runs/submits even if unsolved (+5-15 points)
   - Assign a 0-100 score and 1-2 sentence personalized feedback per participant.

2. **Behavioral Analysis** — Detect patterns:
   - "Speed demon" — solved very fast with few attempts
   - "Methodical coder" — many runs, careful testing before submitting
   - "Brute-forcer" — many rapid submits, trial and error
   - "Observer" — very few actions, possibly stuck or inactive
   - "Close contender" — submitted multiple times but didn't solve
   - Any other patterns you observe from the data

3. **Overall Summary** — 2-3 sentence race recap.

Output ONLY valid JSON matching this schema:
{
  "rankings": [
    { "rank": number, "userId": "string", "userName": "string", "score": number, "feedback": "string" }
  ],
  "behavioral_analysis": [
    { "pattern": "string", "description": "string", "participants": ["userName1"] }
  ],
  "overall_summary": "string"
}

No markdown code fences. JSON only.`;

  const participantLines = input.participants
    .map(
      (p) =>
        `  - ${p.userName} (id: ${p.userId}): ${p.solved ? "SOLVED" : "NOT SOLVED"}, ` +
        `runs: ${p.runCount}, submits: ${p.submissionCount}` +
        (p.solvedAtMs != null ? `, solved at ${Math.round(p.solvedAtMs / 1000)}s` : "") +
        (p.language ? `, language: ${p.language}` : "")
    )
    .join("\n");

  const user = `Race Details:
- Problem: "${input.problemTitle}" (${input.problemTopic || "General"})
- Difficulty: Level ${input.difficulty}
- Duration: ${input.durationMinutes} minutes
- Participants: ${input.participants.length}

Participant Stats:
${participantLines}

Analyze the race and produce rankings + behavioral analysis.`;

  return { system, user };
}

export function parseRaceFeedbackResponse(raw: string): RaceFeedbackResult {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    const rankings: RaceRanking[] = (parsed.rankings || []).map(
      (r: Record<string, unknown>, i: number) => ({
        rank: Number(r.rank) || i + 1,
        userId: String(r.userId || ""),
        userName: String(r.userName || "User"),
        score: Math.min(100, Math.max(0, Number(r.score) || 0)),
        feedback: String(r.feedback || "Good effort!"),
      })
    );

    const behavioral_analysis: BehavioralInsight[] = (
      parsed.behavioral_analysis || []
    ).map((b: Record<string, unknown>) => ({
      pattern: String(b.pattern || "Unknown"),
      description: String(b.description || ""),
      participants: Array.isArray(b.participants)
        ? b.participants.map(String)
        : [],
    }));

    const overall_summary = String(
      parsed.overall_summary || "Race completed. Check individual rankings for details."
    );

    return { rankings, behavioral_analysis, overall_summary };
  } catch {
    return {
      rankings: [],
      behavioral_analysis: [],
      overall_summary: "Unable to parse race analysis. The race data may be insufficient.",
    };
  }
}
