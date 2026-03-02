"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInterviewStore } from "@/stores/interview-store";

export default function InterviewPage() {
  const { messages, status, addMessage, setStatus, reset } = useInterviewStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  async function send() {
    const input = inputRef.current?.value?.trim();
    if (!input || status === "loading") return;
    if (inputRef.current) inputRef.current.value = "";
    addMessage({ role: "user", content: input });
    setStatus("loading");
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          message: input,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Something went wrong.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        addMessage({ role: "assistant", content: errorMessage });
        return;
      }
      
      const data = await res.json();
      if (data.response) {
        addMessage({ role: "assistant", content: data.response });
      } else if (data.error) {
        addMessage({ role: "assistant", content: data.error });
      }
    } catch (error) {
      console.error("Interview error:", error);
      addMessage({ 
        role: "assistant", 
        content: error instanceof Error ? error.message : "Something went wrong." 
      });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Interview</h1>
          <p className="text-sm text-muted-foreground">
            Practice live with an AI interviewer in a focused coding environment.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Practice with AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-auto space-y-2">
            {messages.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Start the interview by saying hello or asking for a question.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded text-sm ${
                  m.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8"
                }`}
              >
                <span className="font-medium">{m.role === "user" ? "You" : "Interviewer"}: </span>
                {m.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Type your response..."
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={status === "loading"}
            />
            <Button onClick={send} disabled={status === "loading"}>
              {status === "loading" ? "Sending…" : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
