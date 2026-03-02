import { create } from "zustand";

export type ContestProblem = { id: string; title: string; order: number };

export type RankingEntry = {
  rank?: number;
  userId: string;
  userName: string;
  score: number;
  solvedCount: number;
};

export type ContestTestResult = {
  passed: number;
  total: number;
  runtime?: number;
  memory?: number;
  complexity?: { time: string; space: string };
  results?: Array<{
    input: string;
    expected: string;
    output: string;
    passed: boolean;
    runtime?: number;
  }>;
};

export type ContestSubmission = {
  id: string;
  problemId: string;
  status: string;
  language: string;
  submittedAt: string;
  runResult?: ContestTestResult | null;
};

interface ContestState {
  contestId: string | null;
  problems: ContestProblem[];
  rankings: RankingEntry[];
  endsAt: string | null;
  isLocked: boolean;
  currentProblemIndex: number;
  testResult: ContestTestResult | null;
  userSubmissionStatus: Record<string, "accepted" | "pending">;
  submissionsMap: Record<string, ContestSubmission[]>;
  codeMap: Record<string, string>;
  setContest: (contestId: string, problems: ContestProblem[], endsAt: string | null) => void;
  setRankings: (rankings: RankingEntry[]) => void;
  setEndsAt: (endsAt: string | null) => void;
  markSolved: (problemId: string) => void;
  lockContest: () => void;
  setCurrentProblem: (index: number) => void;
  setTestResult: (result: ContestTestResult | null) => void;
  addSubmission: (problemId: string, submission: ContestSubmission) => void;
  setSubmissions: (problemId: string, submissions: ContestSubmission[]) => void;
  setCodeForProblem: (problemId: string, code: string) => void;
  getCodeForProblem: (problemId: string) => string | undefined;
  reset: () => void;
}

const initialState = {
  contestId: null as string | null,
  problems: [] as ContestProblem[],
  rankings: [] as RankingEntry[],
  endsAt: null as string | null,
  isLocked: false,
  currentProblemIndex: 0,
  testResult: null as ContestTestResult | null,
  userSubmissionStatus: {} as Record<string, "accepted" | "pending">,
  submissionsMap: {} as Record<string, ContestSubmission[]>,
  codeMap: {} as Record<string, string>,
};

export const useContestStore = create<ContestState>((set, get) => ({
  ...initialState,
  setContest: (contestId, problems, endsAt) =>
    set({ contestId, problems, endsAt }),
  setRankings: (rankings) => set({ rankings }),
  setEndsAt: (endsAt) => set({ endsAt }),
  markSolved: (problemId) =>
    set((s) => ({
      userSubmissionStatus: { ...s.userSubmissionStatus, [problemId]: "accepted" },
    })),
  lockContest: () => set({ isLocked: true }),
  setCurrentProblem: (index) => set({ currentProblemIndex: index, testResult: null }),
  setTestResult: (result) => set({ testResult: result }),
  addSubmission: (problemId, submission) =>
    set((s) => ({
      submissionsMap: {
        ...s.submissionsMap,
        [problemId]: [submission, ...(s.submissionsMap[problemId] ?? [])],
      },
    })),
  setSubmissions: (problemId, submissions) =>
    set((s) => ({
      submissionsMap: { ...s.submissionsMap, [problemId]: submissions },
    })),
  setCodeForProblem: (problemId, code) =>
    set((s) => ({ codeMap: { ...s.codeMap, [problemId]: code } })),
  getCodeForProblem: (problemId) => get().codeMap[problemId],
  reset: () => set(initialState),
}));
