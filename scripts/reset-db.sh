#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DIR/.." && pwd)"

echo "Resetting development database and restarting services..."

cd "$ROOT_DIR"

# Stop and remove containers and volumes to ensure a clean DB state
docker compose down -v

# Start services again
docker compose up -d

echo "Waiting for Postgres to be ready..."
until docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
  printf '.'
  sleep 1
done
echo "\nPostgres is ready."

echo "Running migrations..."
if ! (cd backend && bun run db:migrate); then
  echo "MIGRATIONS FAILED" >&2
  docker compose logs --no-color backend | sed -n '1,200p' >&2 || true
  exit 1
fi

echo "Database reset and migrations complete."
exit 0
