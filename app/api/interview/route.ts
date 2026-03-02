import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { chatCompletion, streamChatCompletion, getModelForUseCase } from "@/lib/ai/client";

const INTERVIEW_SYSTEM = `You are an AI technical interviewer. Ask one coding or system design question at a time. Be concise. After the candidate responds, give brief feedback and then ask the next question. Keep responses under 3 sentences.`;

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { 
    messages?: { role: string; content: string }[]; 
    message?: string;
    stream?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch (error) {
    // Handle empty body or invalid JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    body = {};
  }
  const messages = body.messages ?? [];
  const newMessage = body.message ?? "";
  const shouldStream = body.stream ?? false;
  
  if (!newMessage.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const conversation =
    messages.length > 0
      ? messages
          .map(
            (m: { role: string; content: string }) =>
              `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`
          )
          .join("\n\n") + `\n\nCandidate: ${newMessage}`
      : `Candidate: ${newMessage}`;

  try {
    // Support streaming for real-time conversation
    if (shouldStream) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamChatCompletion(
              INTERVIEW_SYSTEM,
              `Conversation so far:\n\n${conversation}\n\nRespond as the interviewer (brief).`,
              {
                model: getModelForUseCase("interview"),
                maxTokens: 512,
                temperature: 0.7,
              }
            )) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming response
    const response = await chatCompletion(
      INTERVIEW_SYSTEM,
      `Conversation so far:\n\n${conversation}\n\nRespond as the interviewer (brief).`,
      {
        model: getModelForUseCase("interview"),
        maxTokens: 512,
        temperature: 0.7,
      }
    );
    return NextResponse.json({ response });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Interview failed" },
      { status: 502 }
    );
  }
}
