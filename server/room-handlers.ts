import { Server, Socket } from "socket.io";
import {
  getRemainingSeconds,
  getRoomEndsAt,
  setRoomEndsAt,
  startRaceEndCheck,
} from "./timer";

export type RoomParticipant = { userId: string; userName: string };

const roomParticipantsMap = new Map<string, RoomParticipant[]>();
const roomCreatorMap = new Map<string, string>();
const roomCodeToIdMap = new Map<string, string>();

export function getRoomParticipants(roomId: string): RoomParticipant[] {
  return roomParticipantsMap.get(roomId) ?? [];
}

export function setRoomCreator(roomId: string, userId: string): void {
  roomCreatorMap.set(roomId, userId);
}

export function getRoomCreator(roomId: string): string | undefined {
  return roomCreatorMap.get(roomId);
}

export function registerRoomCode(roomId: string, code: string): void {
  roomCodeToIdMap.set(code.toUpperCase(), roomId);
}

export function getRoomIdByCode(code: string): string | undefined {
  return roomCodeToIdMap.get(code.toUpperCase());
}

export function addParticipant(
  roomId: string,
  userId: string,
  userName: string
): void {
  const list = roomParticipantsMap.get(roomId) ?? [];
  if (list.some((p) => p.userId === userId)) return;
  list.push({ userId, userName });
  roomParticipantsMap.set(roomId, list);
}

export function getSocketRoomId(roomIdOrCode: string): string | undefined {
  if (roomIdOrCode.length === 36 && roomIdOrCode.includes("-")) {
    return roomIdOrCode;
  }
  return roomCodeToIdMap.get(roomIdOrCode.toUpperCase());
}

export function registerRoomHandlers(io: Server): void {
  const raceNs = io.of("/race");

  raceNs.on("connection", (socket: Socket) => {
    const userId = (socket.handshake.auth?.userId as string) ?? socket.id;
    const userName = (socket.handshake.auth?.userName as string) ?? "User";

    socket.on("create_room", (payload: { roomId: string; roomCode: string; difficulty?: number }) => {
      const { roomId, roomCode, difficulty = 1 } = payload ?? {};
      if (!roomId || !roomCode) return;
      registerRoomCode(roomId, roomCode);
      setRoomCreator(roomId, userId);
      addParticipant(roomId, userId, userName);
      socket.join(roomId);
      (socket as Socket & { _roomId?: string })._roomId = roomId;
      (socket as Socket & { _difficulty?: number })._difficulty = difficulty;
      socket.emit("room_created", { roomId, roomCode, difficulty });
    });

    socket.on("join_room", (payload: { roomCode: string; roomId?: string }) => {
      const roomId =
        payload?.roomId ?? getRoomIdByCode(payload?.roomCode ?? "");
      if (!roomId) {
        socket.emit("room_full", { message: "Invalid room code" });
        return;
      }
      const participants = roomParticipantsMap.get(roomId) ?? [];
      if (participants.length >= 4) {
        socket.emit("room_full", { message: "Room is full" });
        return;
      }
      addParticipant(roomId, userId, userName);
      socket.join(roomId);      (socket as Socket & { _roomId?: string })._roomId = roomId;
      const updated = roomParticipantsMap.get(roomId) ?? [];
      raceNs.to(roomId).emit("joined_room", { roomId, participants: updated });

      const remaining = getRemainingSeconds(roomId);
      const endsAt = getRoomEndsAt(roomId);
      if (remaining != null && endsAt != null) {
        socket.emit("timer_sync", {
          remainingSeconds: remaining,
          endsAt: new Date(endsAt).toISOString(),
        });
      }
    });

    socket.on("start_race", (payload: { roomId: string; problem?: object; difficulty?: number }) => {
      const roomId = payload?.roomId;
      if (!roomId) return;
      const creator = getRoomCreator(roomId);
      if (creator !== userId) return;

      const difficulty = payload?.difficulty ?? (socket as Socket & { _difficulty?: number })._difficulty ?? 1;
      const problem = payload?.problem ?? (socket as Socket & { _problem?: object })._problem;
      const durationMs =
        difficulty === 1 ? 30 * 60 * 1000 : difficulty === 2 ? 45 * 60 * 1000 : 60 * 60 * 1000;
      const endsAt = Date.now() + durationMs;
      setRoomEndsAt(roomId, endsAt);

      startRaceEndCheck(
        roomId,
        (endedRoomId) => {
          raceNs.to(endedRoomId).emit("race_end", { roomId: endedRoomId });
        },
        (syncRoomId, remainingSeconds, endsAt) => {
          raceNs.to(syncRoomId).emit("timer_sync", {
            remainingSeconds,
            endsAt: new Date(endsAt).toISOString(),
          });
        }
      );

      raceNs.to(roomId).emit("race_started", {
        roomId,
        problem: problem ?? null,
        difficulty,
      });
      raceNs.to(roomId).emit("timer_sync", {
        remainingSeconds: Math.floor(durationMs / 1000),
        endsAt: new Date(endsAt).toISOString(),
      });
    });

    socket.on("run_code", (payload: { roomId: string }) => {
      const roomId = payload?.roomId;
      if (!roomId) return;
      socket.to(roomId).emit("user_ran_code", { userId, userName });
    });

    socket.on("submit_code", (payload: { roomId: string }) => {
      const roomId = payload?.roomId;
      if (!roomId) return;
      socket.to(roomId).emit("user_submitted", { userId, userName });
    });

    socket.on("user_solved", (payload: { roomId: string }) => {
      const roomId = payload?.roomId;
      if (!roomId) return;
      raceNs.to(roomId).emit("user_solved", { userId, userName });
    });

    socket.on("disconnect", () => {
      const roomId = (socket as Socket & { _roomId?: string })._roomId;
      if (!roomId) return;
      const participants = roomParticipantsMap.get(roomId);
      if (participants) {
        const updated = participants.filter((p) => p.userId !== userId);
        roomParticipantsMap.set(roomId, updated);
        raceNs.to(roomId).emit("joined_room", { roomId, participants: updated });
        raceNs.to(roomId).emit("user_ran_code", { userId, userName: `${userName} left the room` });
      }
    });
  });
}

