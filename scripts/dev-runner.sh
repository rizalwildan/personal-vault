#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Root: $ROOT"

echo "Ensuring example env files are copied (if missing)..."
if [ ! -f "$ROOT/backend/.env" ] && [ -f "$ROOT/backend/.env.example" ]; then
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
  echo "Created backend/.env from example"
fi
if [ ! -f "$ROOT/frontend/.env.local" ] && [ -f "$ROOT/frontend/.env.local.example" ]; then
  cp "$ROOT/frontend/.env.local.example" "$ROOT/frontend/.env.local"
  echo "Created frontend/.env.local from example"
fi

echo "Starting services with Docker Compose..."
docker compose up -d

echo "Waiting a few seconds for services to initialize..."
sleep 6

echo "Checking backend (http://localhost:8000/)"
if curl -sS http://localhost:8000/ >/dev/null; then
  echo "Backend: OK"
else
  echo "Backend: not responding yet"
fi

echo "Checking frontend (http://localhost:3000/)"
FRONT_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/ || true)
if [[ "$FRONT_STATUS" =~ ^30[37]$ ]]; then
  echo "Frontend: OK (redirected with status $FRONT_STATUS)"
elif [[ "$FRONT_STATUS" =~ ^2[0-9]{2}$ ]]; then
  echo "Frontend: OK (status $FRONT_STATUS)"
else
  echo "Frontend: may not be ready (http status: ${FRONT_STATUS:-none})"
fi

echo "Checking pgvector extension in database"
if docker compose exec -T postgres psql -U postgres -d personal_vault -c "SELECT extname FROM pg_extension WHERE extname='vector';" | grep -q vector; then
  echo "pgvector: present"
else
  echo "pgvector: not found"
fi

echo "Tailing logs (use Ctrl-C to exit)..."
docker compose logs -f
