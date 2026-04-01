#!/usr/bin/env bash
set -euo pipefail

APP_NAME="agrishrimp-fe"
APP_PORT="${APP_PORT:-3004}"
RUN_DIR=".run"
PID_FILE="$RUN_DIR/$APP_NAME.pid"
LOG_FILE="$RUN_DIR/$APP_NAME.log"

mkdir -p "$RUN_DIR"

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE" || true)
  if [ -n "${OLD_PID:-}" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Stopping old $APP_NAME process PID=$OLD_PID"
    kill "$OLD_PID"
    sleep 3
    kill -9 "$OLD_PID" 2>/dev/null || true
  fi
fi

# Fallback kill by port
EXIST_PID=$(ss -ltnp 2>/dev/null | awk -v p=":$APP_PORT" '$4 ~ p {print $NF}' | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | head -n1)
if [ -n "${EXIST_PID:-}" ]; then
  echo "Port $APP_PORT is occupied by PID=$EXIST_PID. Killing..."
  kill "$EXIST_PID" || true
  sleep 2
fi

echo "Starting $APP_NAME on port $APP_PORT"
nohup npm run start -- -p "$APP_PORT" > "$LOG_FILE" 2>&1 &

echo $! > "$PID_FILE"
echo "Started PID=$(cat "$PID_FILE")"
