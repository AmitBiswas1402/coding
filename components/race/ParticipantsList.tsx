"use client";

import type { Participant } from "@/stores/race-store";

interface ParticipantsListProps {
  participants: Participant[];
  max?: number;
}

export function ParticipantsList({ participants, max = 4 }: ParticipantsListProps) {
  return (
    <div className="p-2">
      <h3 className="text-sm font-medium mb-2">Participants ({participants.length}/{max})</h3>
      <ul className="space-y-1">
        {participants.map((p) => (
          <li key={p.userId} className="text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {p.userName || p.userId.slice(0, 8)}
          </li>
        ))}
      </ul>
    </div>
  );
}
