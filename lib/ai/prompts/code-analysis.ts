export function buildCodeAnalysisPrompt(
  code: string,
  problemTitle: string,
  language: string
): { system: string; user: string } {
  const system = `You are a senior engineer reviewing code. Give concise, actionable feedback on correctness, style, and complexity. Be brief (2-4 sentences).`;
  const user = `Problem: ${problemTitle}\nLanguage: ${language}\n\nCode:\n${code}\n\nProvide short feedback.`;
  return { system, user };
}
