#!/bin/bash
# Swift Hire — ngrok startup script (macOS)
# Usage: bash start-ngrok.sh
# Requires: ngrok installed (brew install ngrok) and authenticated

echo "╔══════════════════════════════════════╗"
echo "║     Swift Hire — ngrok Launcher      ║"
echo "╚══════════════════════════════════════╝"

# Check ngrok is installed
if ! command -v ngrok &> /dev/null; then
  echo "❌ ngrok not found. Install it: brew install ngrok"
  echo "   Then authenticate: ngrok config add-authtoken <your-token>"
  echo "   Sign up free at: https://ngrok.com"
  exit 1
fi

# Kill any existing ngrok process
pkill -f ngrok 2>/dev/null
sleep 1

echo ""
echo "▶ Starting ngrok tunnel on port 5173..."
ngrok http 5173 > /dev/null &
sleep 3

# Fetch the public URL from ngrok's local API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | \
  python3 -c "import sys,json; tunnels=json.load(sys.stdin)['tunnels']; \
  https=[t for t in tunnels if t['proto']=='https']; \
  print(https[0]['public_url'] if https else tunnels[0]['public_url'])" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
  echo "❌ Could not get ngrok URL. Make sure ngrok is authenticated."
  exit 1
fi

echo "✅ Ngrok tunnel active: $NGROK_URL"
echo ""
echo "📧 Verification emails will link to: $NGROK_URL/verify-email?token=..."
echo ""
echo "▶ Starting backend..."
echo "   (Press Ctrl+C to stop)"
echo ""

cd "$(dirname "$0")/backend"
FRONTEND_URL=$NGROK_URL JAVA_HOME=/opt/homebrew/opt/openjdk@17 mvn spring-boot:run
