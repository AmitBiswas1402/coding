import OpenAI from "openai";

// Model configuration for different use cases
export const AI_MODELS = {
  // Question generation - needs good reasoning
  questionGen: process.env.OPENROUTER_MODEL_QUESTION || "openai/gpt-4o-mini",
  // Code analysis - needs code understanding
  codeAnalysis: process.env.OPENROUTER_MODEL_CODE || "openai/gpt-4o-mini",
  // Interview chat - needs conversational ability
  interview: process.env.OPENROUTER_MODEL_INTERVIEW || "openai/gpt-4o-mini",
  // Default fallback
  default: process.env.OPENROUTER_MODEL_DEFAULT || "openai/gpt-4o-mini",
} as const;

function getClient(): OpenAI | null {
  const key = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!key) return null;
  
  const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const baseURL = isOpenRouter ? "https://openrouter.ai/api/v1" : undefined;
  
  // OpenRouter requires specific headers
  const defaultHeaders: Record<string, string> = {};
  if (isOpenRouter) {
    defaultHeaders["HTTP-Referer"] = process.env.OPENROUTER_HTTP_REFERER || "https://coding-arena.com";
    defaultHeaders["X-Title"] = process.env.OPENROUTER_X_TITLE || "Coding Arena";
  }
  
  return new OpenAI({
    apiKey: key,
    baseURL,
    defaultHeaders,
  });
}

export interface ChatCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export async function chatCompletion(
  system: string,
  user: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const openai = getClient();
  if (!openai) {
    throw new Error("No OpenAI or OpenRouter API key set. Please configure OPENROUTER_API_KEY in your .env file");
  }

  const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const model = options.model || (isOpenRouter ? AI_MODELS.default : "gpt-4o-mini");
  
  // Ensure OpenRouter model format
  const finalModel = isOpenRouter && !model.includes("/") 
    ? `openai/${model}` 
    : model;

  try {
    const res = await openai.chat.completions.create({
      model: finalModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
      stream: options.stream || false,
    });

    if (options.stream) {
      throw new Error("Streaming not yet implemented in chatCompletion. Use streamChatCompletion instead.");
    }

    const content = res.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from LLM");
    }
    return content;
  } catch (error) {
    if (error instanceof Error) {
      // Provide more helpful error messages
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        throw new Error("Invalid API key. Please check your OPENROUTER_API_KEY in .env file");
      }
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        throw new Error("Rate limit exceeded. Please try again later");
      }
      if (error.message.includes("model")) {
        throw new Error(`Model error: ${error.message}. Please check your model configuration.`);
      }
      throw error;
    }
    throw new Error("Unknown error occurred while calling AI service");
  }
}

export async function* streamChatCompletion(
  system: string,
  user: string,
  options: ChatCompletionOptions = {}
): AsyncGenerator<string, void, unknown> {
  const openai = getClient();
  if (!openai) {
    throw new Error("No OpenAI or OpenRouter API key set. Please configure OPENROUTER_API_KEY in your .env file");
  }

  const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const model = options.model || (isOpenRouter ? AI_MODELS.interview : "gpt-4o-mini");
  
  // Ensure OpenRouter model format
  const finalModel = isOpenRouter && !model.includes("/") 
    ? `openai/${model}` 
    : model;

  try {
    const stream = await openai.chat.completions.create({
      model: finalModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        throw new Error("Invalid API key. Please check your OPENROUTER_API_KEY in .env file");
      }
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        throw new Error("Rate limit exceeded. Please try again later");
      }
      throw error;
    }
    throw new Error("Unknown error occurred while streaming from AI service");
  }
}

// Helper function to get model for specific use case
export function getModelForUseCase(useCase: keyof typeof AI_MODELS): string {
  const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const model = AI_MODELS[useCase];
  return isOpenRouter ? model : model.replace(/^[^/]+\//, "");
}
