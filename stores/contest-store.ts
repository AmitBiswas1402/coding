import { create } from "zustand";

export type ContestProblem = { id: string; title: string; order: number };

export type RankingEntry = {
  userId: string;
  userName: string;
  score: number;
  solvedCount: number;
};

interface ContestState {
  contestId: string | null;
  problems: ContestProblem[];
  rankings: RankingEntry[];
  endsAt: string | null;
  userSubmissionStatus: Record<string, "accepted" | "pending">;
  setContest: (contestId: string, problems: ContestProblem[], endsAt: string | null) => void;
  setRankings: (rankings: RankingEntry[]) => void;
  setEndsAt: (endsAt: string | null) => void;
  markSolved: (problemId: string) => void;
  reset: () => void;
}

const initialState = {
  contestId: null,
  problems: [],
  rankings: [],
  endsAt: null,
  userSubmissionStatus: {} as Record<string, "accepted" | "pending">,
};

export const useContestStore = create<ContestState>((set) => ({
  ...initialState,
  setContest: (contestId, problems, endsAt) =>
    set({ contestId, problems, endsAt }),
  setRankings: (rankings) => set({ rankings }),
  setEndsAt: (endsAt) => set({ endsAt }),
  markSolved: (problemId) =>
    set((s) => ({
      userSubmissionStatus: { ...s.userSubmissionStatus, [problemId]: "accepted" },
    })),
  reset: () => set(initialState),
}));
