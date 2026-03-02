import { create } from "zustand";

export type DayStat = { date: string; count: number };

interface AnalyticsState {
  submissionsByDay: DayStat[];
  problemsSolved: number;
  accuracy: number;
  streak: number;
  setStats: (stats: {
    submissionsByDay: DayStat[];
    problemsSolved: number;
    accuracy: number;
    streak: number;
  }) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  submissionsByDay: [],
  problemsSolved: 0,
  accuracy: 0,
  streak: 0,
  setStats: (stats) => set(stats),
}));
