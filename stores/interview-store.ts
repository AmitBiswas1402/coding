import { create } from "zustand";
import type { InterviewQuestion } from "@/lib/ai/prompts/interview-question";
import type { InterviewScores } from "@/lib/ai/prompts/interview-evaluation";

export type InterviewStatus =
  | "idle"
  | "generating"
  | "active"
  | "submitting"
  | "completed";

export type InterviewTestResult = {
  passed: number;
  total: number;
  runtime?: number;
  memory?: string;
  complexity?: string;
  results?: {
    passed: boolean;
    input: string;
    expected?: string;
    actual?: string;
    runtime?: number;
  }[];
};

interface InterviewState {
  sessionId: string | null;
  question: InterviewQuestion | null;
  level: string | null;
  companyCategory: string | null;
  topic: string | null;
  endsAt: string | null;
  isLocked: boolean;
  status: InterviewStatus;
  testResult: InterviewTestResult | null;
  code: string;
  language: string;
  runAttempts: number;
  scores: InterviewScores | null;

  setSession: (id: string, question: InterviewQuestion, endsAt: string) => void;
  setConfig: (level: string, companyCategory: string, topic: string | null) => void;
  setStatus: (status: InterviewStatus) => void;
  lockSession: () => void;
  setTestResult: (result: InterviewTestResult | null) => void;
  incrementRuns: () => void;
  setCode: (code: string) => void;
  setLanguage: (language: string) => void;
  setScores: (scores: InterviewScores) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  question: null,
  level: null,
  companyCategory: null,
  topic: null,
  endsAt: null,
  isLocked: false,
  status: "idle" as InterviewStatus,
  testResult: null,
  code: "",
  language: "java",
  runAttempts: 0,
  scores: null,
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,
  setSession: (sessionId, question, endsAt) =>
    set({ sessionId, question, endsAt, status: "active" }),
  setConfig: (level, companyCategory, topic) =>
    set({ level, companyCategory, topic }),
  setStatus: (status) => set({ status }),
  lockSession: () => set({ isLocked: true }),
  setTestResult: (testResult) => set({ testResult }),
  incrementRuns: () => set((s) => ({ runAttempts: s.runAttempts + 1 })),
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setScores: (scores) =>
    set({ scores, status: "completed" }),
  reset: () => set(initialState),
}));

