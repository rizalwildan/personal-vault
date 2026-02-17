# BMad Personal Vault — Local development

Quick guide to start the development stack (Postgres with pgvector, backend, frontend).

Prerequisites

- Docker Desktop (Docker Engine + Docker Compose v2)
- Optional: `psql` and `curl` for manual checks

Quick start

1. Copy env examples if you haven't already:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.local.example frontend/.env.local`

2. Start the stack (detached):

   ```bash
   docker compose up -d
   ```

3. Verify services:
   - Backend: `http://localhost:8000/` (should return JSON message)
   - Frontend: `http://localhost:3000/` (dev server; may redirect to `/login`)
   - Postgres: `localhost:5432` (DB name: `personal_vault`)

Useful checks

```bash
# list containers
docker compose ps

# backend quick check
curl http://localhost:8000/

# frontend quick check (may redirect)
curl -vS http://localhost:3000/

# check pgvector inside postgres
docker compose exec postgres psql -U postgres -d personal_vault -c "SELECT extname FROM pg_extension WHERE extname='vector';"

# view logs
docker compose logs -f

# stop and remove containers
docker compose down
```

Automated dev runner

- A small helper script is provided at `scripts/dev-runner.sh` that copies missing envs, brings the stack up, performs basic health checks and tails logs.

Notes

- Do NOT commit `.env` files. Use the example files as templates.
- Default development DB credentials are `postgres:postgres` — change for any non-dev environment.
