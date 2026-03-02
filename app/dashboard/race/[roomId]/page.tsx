"use client";

import { useParams } from "next/navigation";
import { RaceLayout } from "@/components/race/RaceLayout";

export default function RaceRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return <RaceLayout roomId={roomId} />;
}
