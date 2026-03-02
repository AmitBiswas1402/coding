import { create } from "zustand";

export type Message = { role: "user" | "assistant"; content: string };

interface InterviewState {
  sessionId: string | null;
  messages: Message[];
  currentQuestion: string | null;
  status: "idle" | "loading";
  setSession: (sessionId: string) => void;
  addMessage: (msg: Message) => void;
  setQuestion: (q: string | null) => void;
  setStatus: (status: "idle" | "loading") => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  messages: [],
  currentQuestion: null,
  status: "idle" as const,
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,
  setSession: (sessionId) => set({ sessionId }),
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  setQuestion: (currentQuestion) => set({ currentQuestion }),
  setStatus: (status) => set({ status }),
  reset: () => set(initialState),
}));
