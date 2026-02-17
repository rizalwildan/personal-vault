#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$DIR/.." && pwd)"

echo "Starting development environment..."

cd "$ROOT_DIR"

# Start services (idempotent)
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

cat <<EOF
✅ Development environment ready!
   Frontend: http://localhost:3000
   Backend:  http://localhost:8000
   Swagger:  http://localhost:8000/swagger
EOF

exit 0
