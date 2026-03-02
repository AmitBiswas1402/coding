export type QuestionGenParams = {
  level: string;
  companyType: string;
  topic: string;
  sourceStyle: string;
};

export function buildQuestionGenPrompt(params: QuestionGenParams): {
  system: string;
  user: string;
} {
  const { level, companyType, topic, sourceStyle } = params;
  const system = `You are a technical interviewer. Generate a single coding problem in the style of ${sourceStyle}, suitable for ${level} at ${companyType} companies. Topic: ${topic}. Output valid JSON only.`;
  const user = `Generate one problem with these exact keys (all strings unless noted):
- title
- statement (markdown string)
- constraints
- input_format
- output_format
- sample_inputs (array of strings)
- sample_outputs (array of strings)
- hidden_inputs (array of strings)
- hidden_outputs (array of strings)
- time_complexity
- space_complexity
- difficulty (number 1, 2, or 3)

Return only the JSON object, no markdown code fence.`;
  return { system, user };
}
