import { create } from "zustand";

export type RaceStatus = "waiting" | "running" | "finished";

export type Participant = { userId: string; userName: string };

export type ActivityItem = {
  type: "run" | "submit" | "solved";
  userId: string;
  userName: string;
  at: number;
};

export type Problem = {
  id: string;
  title: string;
  statement: string;
  constraints?: string | null;
  inputFormat?: string | null;
  outputFormat?: string | null;
  difficulty: number;
  topic?: string | null;
};

interface RaceState {
  roomId: string | null;
  roomCode: string | null;
  participants: Participant[];
  problem: Problem | null;
  status: RaceStatus;
  endsAt: string | null;
  currentUserRole: "host" | "participant";
  activityLog: ActivityItem[];
  setRoom: (roomId: string, roomCode: string) => void;
  setProblem: (problem: Problem | null) => void;
  setParticipants: (p: Participant[]) => void;
  setTimer: (endsAt: string | null) => void;
  addActivity: (item: ActivityItem) => void;
  setStatus: (status: RaceStatus) => void;
  setRole: (role: "host" | "participant") => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  roomCode: null,
  participants: [],
  problem: null,
  status: "waiting" as RaceStatus,
  endsAt: null,
  currentUserRole: "participant" as const,
  activityLog: [],
};

export const useRaceStore = create<RaceState>((set) => ({
  ...initialState,
  setRoom: (roomId, roomCode) => set({ roomId, roomCode }),
  setProblem: (problem) => set({ problem }),
  setParticipants: (participants) => set({ participants }),
  setTimer: (endsAt) => set({ endsAt }),
  addActivity: (item) =>
    set((s) => ({ activityLog: [...s.activityLog.slice(-49), item] })),
  setStatus: (status) => set({ status }),
  setRole: (currentUserRole) => set({ currentUserRole }),
  reset: () => set(initialState),
}));
