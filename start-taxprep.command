#!/bin/bash
# TaxPrep Study App Launcher
# Double-click to start the development server and open in browser

cd "$(dirname "$0")"
PROJECT_DIR="/Users/oladimejibabalola/dyad-apps/lunar-gecko-beam"

# Check if already running
if lsof -i :5173 > /dev/null 2>&1; then
    echo "✅ Server already running on port 5173"
    open "http://localhost:5173"
    exit 0
fi

echo "🚀 Starting TaxPrep Study App..."
echo "📁 Project: $PROJECT_DIR"

# Start the dev server in background
cd "$PROJECT_DIR"
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Server started!"
        sleep 1
        open "http://localhost:5173"
        echo ""
        echo "=========================================="
        echo "  TaxPrep is running at localhost:5173"
        echo "  Press Ctrl+C to stop the server"
        echo "=========================================="
        wait $DEV_PID
        exit 0
    fi
    sleep 1
done

echo "❌ Failed to start server"
exit 1
