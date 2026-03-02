"use client";

import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(auth?: { userId: string; userName: string }): Socket {
  if (typeof window === "undefined") {
    throw new Error("Socket can only be used on the client");
  }
  if (!socket) {
    socket = io(`${SOCKET_URL}/race`, {
      auth: auth ?? {},
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
