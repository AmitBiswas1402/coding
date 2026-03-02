const roomEndsAt = new Map<string, number>();
const roomIntervals = new Map<string, NodeJS.Timeout>();
const roomSyncIntervals = new Map<string, NodeJS.Timeout>();

export function setRoomEndsAt(roomId: string, endsAt: number): void {
  roomEndsAt.set(roomId, endsAt);
}

export function getRoomEndsAt(roomId: string): number | undefined {
  return roomEndsAt.get(roomId);
}

export function getRemainingSeconds(roomId: string): number | null {
  const endsAt = roomEndsAt.get(roomId);
  if (endsAt == null) return null;
  const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
  return remaining;
}

export function startRaceEndCheck(
  roomId: string,
  onEnd: (roomId: string) => void,
  onSync?: (roomId: string, remainingSeconds: number, endsAt: number) => void
): void {
  const existing = roomIntervals.get(roomId);
  if (existing) clearInterval(existing);

  const interval = setInterval(() => {
    const remaining = getRemainingSeconds(roomId);
    if (remaining !== null && remaining <= 0) {
      clearInterval(interval);
      roomIntervals.delete(roomId);
      clearSyncInterval(roomId);
      roomEndsAt.delete(roomId);
      onEnd(roomId);
    }
  }, 1000);

  roomIntervals.set(roomId, interval);

  // Periodic timer_sync every 10 seconds to keep clients in sync
  if (onSync) {
    const existingSync = roomSyncIntervals.get(roomId);
    if (existingSync) clearInterval(existingSync);

    const syncInterval = setInterval(() => {
      const remaining = getRemainingSeconds(roomId);
      const endsAt = getRoomEndsAt(roomId);
      if (remaining !== null && endsAt != null) {
        onSync(roomId, remaining, endsAt);
      }
    }, 10_000);

    roomSyncIntervals.set(roomId, syncInterval);
  }
}

function clearSyncInterval(roomId: string): void {
  const interval = roomSyncIntervals.get(roomId);
  if (interval) {
    clearInterval(interval);
    roomSyncIntervals.delete(roomId);
  }
}

export function clearRoomTimer(roomId: string): void {
  const interval = roomIntervals.get(roomId);
  if (interval) {
    clearInterval(interval);
    roomIntervals.delete(roomId);
  }
  clearSyncInterval(roomId);
  roomEndsAt.delete(roomId);
}
