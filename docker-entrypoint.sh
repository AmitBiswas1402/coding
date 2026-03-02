#!/bin/sh
set -e

echo "Starting Socket.IO server on port ${SOCKET_PORT:-3001}..."
node_modules/.bin/tsx server/index.ts &
SOCKET_PID=$!

echo "Starting Next.js on port ${PORT:-3000}..."
node server.js &
NEXT_PID=$!

echo "Both servers running. Socket PID=$SOCKET_PID  Next.js PID=$NEXT_PID"

# If either process exits, shut down both
wait $SOCKET_PID $NEXT_PID
