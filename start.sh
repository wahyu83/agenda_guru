#!/bin/bash
echo "=== Starting Agenda Guru ==="

# Start backend
cd "$(dirname "$0")/backend"
echo "Starting backend on port 3000..."
node src/index.js &
BEPID=$!
sleep 2

# Start frontend
cd "$(dirname "$0")"
echo "Starting frontend on port 5173..."
npx vite --port 5173 --host &
FEPID=$!
sleep 3

echo ""
echo "=== Servers running ==="
echo "Backend:  http://localhost:3000 (PID $BEPID)"
echo "Frontend: http://localhost:5173 (PID $FEPID)"
echo ""
echo "Login:"
echo "  Admin:  admin / admin123"
echo "  Piket:  piket1 / piket123"
echo ""
echo "Press Ctrl+C to stop all"
wait
