#!/bin/sh
set -e

echo "Starting Real-time Crypto Dashboard..."

# Start backend with PM2
echo "Starting backend on port 3000..."
cd /app/backend
pm2 start dist/main.js --name backend --no-daemon &

# Start frontend with serve
echo "Starting frontend on port 5173..."
cd /app/frontend
serve -s dist -l 5173 &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
