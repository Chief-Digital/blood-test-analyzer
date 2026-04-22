#!/bin/bash
# Blood Test Analyzer — Startup Script

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

# Load .env if present
if [ -f "$APP_DIR/.env" ]; then
  export $(grep -v '^#' "$APP_DIR/.env" | xargs)
fi

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠️  ANTHROPIC_API_KEY is not set."
  echo "   Add it to the .env file in the app folder."
  echo ""
fi

# Install dependencies if needed
python3 -m pip install flask flask-cors anthropic --quiet 2>/dev/null

echo "🩸 Starting Blood Test Analyzer..."
echo "   Open your browser at: http://localhost:5050"
echo ""
python3 app.py
