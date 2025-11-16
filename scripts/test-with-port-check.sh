#!/bin/bash

# Test runner script with port availability check and process management
# Usage: ./scripts/test-with-port-check.sh [test-file]

set -e

PORT=3000
TIMEOUT=300  # Increased to 5 minutes for long-running visual tests

# Cleanup function to kill all related processes
cleanup() {
  echo "🧹 Cleaning up..."

  # Kill any process on port 3000
  lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true

  # Kill any hanging playwright/chromium processes
  pkill -9 -f "playwright" 2>/dev/null || true
  pkill -9 -f "chromium" 2>/dev/null || true
  pkill -9 -f "node.*vite" 2>/dev/null || true

  echo "✅ Cleanup complete"
}

# Set trap to cleanup on script exit (success or failure)
trap cleanup EXIT INT TERM

echo "🔍 Checking port $PORT availability..."

# Kill any existing process on port 3000
if lsof -ti:$PORT > /dev/null 2>&1; then
  echo "⚠️  Port $PORT is in use. Killing existing process..."
  lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
  sleep 2
fi

# Verify port is free
if lsof -ti:$PORT > /dev/null 2>&1; then
  echo "❌ Failed to free port $PORT. Exiting."
  exit 1
fi

echo "✅ Port $PORT is available"

# Create debug directory if it doesn't exist
mkdir -p test-results/debug
echo "📁 Created test-results/debug directory"

# Run tests with timeout
TEST_FILE="${1:-tests/e2e/06-debug-analysis.spec.ts}"

echo "🧪 Running Playwright tests: $TEST_FILE"
echo "⏱️  Timeout: ${TIMEOUT}s"
echo "⚠️  Test includes long waits (30s+ for some analyses)"
echo ""

# Run in background with timeout so we can monitor
timeout $TIMEOUT npm run test:e2e -- "$TEST_FILE" --reporter=line 2>&1 &
TEST_PID=$!

echo "📊 Test process started (PID: $TEST_PID)"
echo "💡 Use 'tail -f test-results/debug/*.log' to monitor progress"
echo ""

# Wait for test process
wait $TEST_PID
EXIT_CODE=$?

if [ $EXIT_CODE -eq 124 ]; then
  echo ""
  echo "❌ Tests timed out after ${TIMEOUT}s"
  echo "💡 Try running individual tests or increasing TIMEOUT in script"
  exit $EXIT_CODE
elif [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Tests failed with exit code: $EXIT_CODE"
  exit $EXIT_CODE
fi

echo ""
echo "✅ Tests completed successfully"
echo "📸 Screenshots saved in: test-results/debug/"
ls -lh test-results/debug/*.png 2>/dev/null | wc -l | xargs echo "   Total screenshots:"
