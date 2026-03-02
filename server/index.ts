import { createServer } from "http";
import { Server } from "socket.io";
import { registerRoomHandlers } from "./room-handlers";

const PORT = process.env.SOCKET_PORT ?? 3001;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

registerRoomHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Socket server listening on port ${PORT}`);
});
