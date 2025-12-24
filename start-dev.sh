#!/bin/bash
# Bash script to start development environment
# This starts backend services in Docker and frontend directly

echo "🚀 Starting Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi

echo "📦 Starting backend services (Docker)..."
docker-compose up -d postgres redis gateway auth-service adminservice

echo ""
echo "✅ Backend services started!"
echo ""
echo "🎨 Starting frontend dev server..."
echo ""

# Start frontend in background
cd frontend/earnings-calendar
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✨ Development environment ready!"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Gateway API: http://localhost:3000"
echo ""
echo "💡 Tip: Changes to frontend code will hot-reload automatically!"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
trap "kill $FRONTEND_PID; docker-compose down; exit" INT TERM
wait $FRONTEND_PID

