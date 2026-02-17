# Epic 1: Foundation & Infrastructure Setup

**Status:** Complete (5/5 stories complete)
**Priority:** CRITICAL (Blocking)
**Estimated Duration:** 3-5 days
**Dependencies:** None (First Epic)

---

## Epic Goal

Establish the foundational infrastructure for BMad-Personal-Vault, including Docker Compose environment, PostgreSQL database with pgvector extension, monorepo configuration, and basic backend scaffolding. This epic creates the development environment that all subsequent work depends on.

---

## Epic Description

### Project Context

BMad-Personal-Vault is a self-hosted knowledge management system for solo developers. The frontend UI is already designed (Next.js 16 with shadcn/ui), but requires both backend API implementation and frontend logic integration. This epic focuses on setting up the infrastructure foundation.

**Current State:**

- ✅ Frontend UI components exist (static, no logic)
- ✅ PRD and Architecture documents complete
- ✅ Backend infrastructure scaffolded (Elysia.js project initialized)
- ✅ Database configured (PostgreSQL 16 with pgvector extension via Docker image/migration)
- ✅ Docker Compose configuration added and verified for local orchestration
- ✅ Monorepo configured (`pnpm` workspaces with `frontend/`, `backend/`, `shared/`)

**Technology Stack:**

- **Backend**: Elysia.js on Bun 1.x
- **Database**: PostgreSQL 16+ with pgvector 0.6.0+
- **Deployment**: Docker Compose (local dev + VPS production)
- **Monorepo**: pnpm workspaces
- **ORM**: Drizzle ORM

---

### What This Epic Delivers

By completing this epic, developers will have:

1. **Working Docker Compose Environment**
   - PostgreSQL 16 with pgvector extension running
   - Frontend container configured (existing Next.js app)
   - Backend container scaffolded (Elysia.js hello-world)
   - All services communicating via Docker network

2. **Monorepo Structure**
   - pnpm workspace configured with `frontend/`, `backend/`, `shared/`
   - Shared types directory for Zod schemas
   - Import aliases configured (`@/shared`)

3. **Backend Project Initialized**
   - Elysia.js project structure
   - Basic health check endpoint (`/health`)
   - Database connection configured with Drizzle ORM
   - Environment variable management

4. **Development Scripts**
   - `scripts/dev.sh` - Start all services with health checks
   - `scripts/reset-db.sh` - Drop and recreate database
   - `docker-compose.yml` - Local development
   - `docker-compose.prod.yml` - Production overrides

---

## Stories

### Story 1: Docker Compose Infrastructure Setup

**Goal:** Create Docker Compose configuration with PostgreSQL+pgvector and service orchestration.

**Key Tasks:**

- Create `docker-compose.yml` with 3 services: frontend, backend, postgres
- Configure PostgreSQL 16 with pgvector extension
- Set up Docker networks and volumes
- Create `.env.example` with required variables (DB credentials, ports)
- Add health checks for all services

**Acceptance Criteria:**

- [ ] `docker-compose up` starts all 3 services without errors
- [ ] PostgreSQL accessible at `localhost:5432` with pgvector enabled
- [ ] Frontend accessible at `localhost:3000` (existing Next.js app)
- [ ] Backend placeholder accessible at `localhost:8000`
- [ ] All services restart automatically on failure
- [ ] Database data persists across restarts (volume mounted)

**Testing:**

- Run `docker-compose up` and verify all services healthy
- Connect to PostgreSQL: `psql -h localhost -U postgres -d personal_vault`
- Verify pgvector: `SELECT * FROM pg_extension WHERE extname = 'vector';`
- Test service communication: backend can connect to database

---

### Story 2: Monorepo Configuration with pnpm Workspaces

**Goal:** Set up monorepo structure with shared types and proper dependency management.

**Key Tasks:**

- Create `pnpm-workspace.yaml` defining `frontend/`, `backend/`, `shared/`
- Create `/shared` directory with TypeScript configuration
- Set up shared Zod schemas directory (`shared/schemas/`)
- Configure import aliases for all packages
- Update `package.json` scripts for workspace commands

**Acceptance Criteria:**

- [ ] `pnpm install` installs dependencies for all workspaces
- [ ] Frontend can import: `import { NoteSchema } from '@/shared/schemas/note'`
- [ ] Backend can import: `import { NoteSchema } from '@/shared/schemas/note'`
- [ ] TypeScript resolves shared types without errors
- [ ] Workspace commands work: `pnpm --filter backend dev`

**File Structure:**

```
/
├── frontend/                 # Existing Next.js app
├── backend/                  # New Elysia.js app
├── shared/                   # New shared code
│   ├── schemas/              # Zod schemas
│   │   ├── user.ts
│   │   ├── note.ts
│   │   ├── tag.ts
│   │   └── session.ts
│   └── types/                # Shared TypeScript types
├── pnpm-workspace.yaml
└── package.json
```

---

### Story 3: Backend Project Initialization with Elysia.js

**Goal:** Create basic Elysia.js backend with health check endpoint and database connection.

**Key Tasks:**

- Initialize Bun project in `backend/` directory
- Install core dependencies: `elysia`, `@elysiajs/swagger`, `drizzle-orm`, `postgres`
- Create basic Elysia app with hello-world endpoint
- Configure Drizzle ORM with PostgreSQL connection
- Create health check endpoint (`GET /health`)
- Set up CORS for frontend communication

**Acceptance Criteria:**

- [ ] `bun run backend/src/index.ts` starts server on port 8000
- [ ] `GET http://localhost:8000/health` returns `200 OK`
- [ ] Swagger docs accessible at `http://localhost:8000/swagger`
- [ ] Backend connects to PostgreSQL successfully
- [ ] CORS allows requests from `http://localhost:3000`
- [ ] Hot reload works during development

**Backend Structure:**

```
backend/
├── src/
│   ├── index.ts              # Elysia app entry point
│   ├── db/
│   │   ├── client.ts         # Drizzle client setup
│   │   └── schema/           # (Empty for now, Epic 2/3 will populate)
│   ├── routes/
│   │   └── health.ts         # Health check endpoint
│   └── utils/
│       └── env.ts            # Environment validation
├── tests/
├── package.json
├── tsconfig.json
├── Dockerfile                # FROM oven/bun:1
└── .env.example
```

**Sample Code (index.ts):**

```typescript
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { healthRoute } from './routes/health';

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(healthRoute)
  .get('/', () => ({ message: 'BMad Personal Vault API' }))
  .listen(8000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
```

---

### Story 4: Drizzle ORM Setup and Initial Schema Structure

**Goal:** Configure Drizzle ORM with migrations and create empty schema files ready for Epic 2/3.

**Key Tasks:**

- Install Drizzle ORM and Drizzle Kit
- Create `drizzle.config.ts` for migrations
- Set up database client in `backend/src/db/client.ts`
- Create empty schema files (users, notes, tags, sessions)
- Create initial migration for pgvector extension
- Add migration scripts to package.json

**Acceptance Criteria:**

- [ ] `bun run db:generate` generates migration files
- [ ] `bun run db:migrate` applies migrations to PostgreSQL
- [ ] pgvector extension enabled via migration
- [ ] Database client exportable: `import { db } from '@/db/client'`
- [ ] Schema files created (empty tables for now)
- [ ] Rollback works: `bun run db:rollback`

**Configuration (drizzle.config.ts):**

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Initial Migration (0000_init.sql):**

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Schema files will be populated in Epic 2 & 3
```

---

### Story 5: Development Scripts and Documentation

**Goal:** Create helper scripts and documentation for developers to start working immediately.

**Key Tasks:**

- Create `scripts/dev.sh` - Start Docker Compose with health checks
- Create `scripts/reset-db.sh` - Drop/recreate database for clean state
- Create `scripts/seed.sh` - (Empty for now, Epic 3 will add seed data)
- Update `README.md` with setup instructions
- Create `docs/setup-guide.md` with troubleshooting section
- Add `.dockerignore` and `.gitignore` updates

**Acceptance Criteria:**

- [ ] `./scripts/dev.sh` starts all services and waits for health checks
- [ ] `./scripts/reset-db.sh` drops database and re-runs migrations
- [ ] README has clear "Getting Started" section (<5 minutes to first run)
- [ ] Setup guide includes troubleshooting for common Docker issues
- [ ] All scripts are executable (`chmod +x scripts/*`)

**Sample scripts/dev.sh:**

```bash
#!/bin/bash
set -e

echo "🚀 Starting BMad Personal Vault development environment..."

# Start Docker Compose
docker-compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U postgres; do
  sleep 1
done

# Run migrations
echo "📦 Running database migrations..."
cd backend && bun run db:migrate && cd ..

# Show service status
docker-compose ps

echo "✅ Development environment ready!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   Swagger:  http://localhost:8000/swagger"
```

---

## Dependencies

**Depends On:** None (This is Epic 1 - Foundation)

**Blocks:**

- Epic 2: Backend Auth System (needs database and backend structure)
- Epic 3: Backend Notes CRUD (needs database and backend structure)
- All subsequent epics depend on this infrastructure

---

## Risk Mitigation

### Primary Risks

1. **Docker Compose Configuration Issues**
   - Risk: Services fail to start, network issues, volume permission problems
   - Mitigation: Include comprehensive troubleshooting guide; test on macOS, Linux, Windows
   - Rollback: Document manual setup process as fallback

2. **pgvector Extension Installation Failure**
   - Risk: pgvector may not install properly depending on PostgreSQL image
   - Mitigation: Use `pgvector/pgvector:pg16` official Docker image
   - Fallback: If pgvector fails, Epic 4 can temporarily use PostgreSQL full-text search

3. **Monorepo Import Resolution Issues**
   - Risk: TypeScript may not resolve shared types correctly
   - Mitigation: Test imports in both frontend and backend before completing story
   - Rollback: Duplicate schemas temporarily if import resolution fails

---

## Definition of Done

- [ ] All 5 stories completed with acceptance criteria met
- [ ] `docker-compose up` starts working environment in <2 minutes
- [ ] Developer can run `./scripts/dev.sh` and see "ready" message
- [ ] Database persists data across restarts
- [ ] Monorepo structure allows shared code between frontend/backend
- [ ] Backend health check endpoint returns 200 OK
- [ ] README and setup guide tested by fresh developer (or simulate)
- [ ] All configuration files committed to repository

---

## Success Metrics

**Time to First Run:** New developer can run `./scripts/dev.sh` and see working environment in <5 minutes

**Infrastructure Stability:** All services restart automatically on failure

**Developer Experience:** Clear error messages and troubleshooting guide reduces setup friction

---

## Notes for Developers

- **This epic is 100% infrastructure** - no business logic yet
- **Goal is speed:** Optimize for getting something running quickly, refine later
- **Test on multiple platforms:** Verify Docker Compose works on macOS, Linux, Windows WSL2
- **Keep it simple:** Avoid over-engineering the monorepo setup
- **Document everything:** Future you (or other developers) will thank you

---

## Handoff to Next Epic

Once Epic 1 is complete, Epic 2 (Backend Auth System) can begin. Developers will have:

- ✅ Working database
- ✅ Backend project structure
- ✅ Drizzle ORM configured
- ✅ Development environment running

## PO Checklist Results

**Project Type:** Brownfield (existing frontend) with UI components present

**Executive Summary:**

- Overall readiness: ~80% — four of five epic stories completed (Stories 1.1, 1.2, 1.3, 1.4).
- Go/No-Go recommendation: Proceed to Epic 2 (Backend Auth) while finishing Story 5 (dev scripts & docs).
- Critical blocking issues: 0 blocking items; remaining work is documentation and helper scripts.

**Validation Highlights (selected):**

- Infrastructure & Database: Verified — Docker Compose, PostgreSQL 16, and `pgvector` enabled via migration.
- Monorepo: Verified — `pnpm-workspace.yaml` and shared types/schemas scaffolded.
- Backend scaffold: Verified — Elysia app with health endpoint and Drizzle client present.
- Remaining: Developer helper scripts, README/setup guide, and production hardening checklist (Story 5).

**Top Recommendations:**

- Complete Story 5: add `scripts/dev.sh`, `scripts/reset-db.sh`, and `docs/setup-guide.md` and mark executable.
- Add a short walkthrough for running migrations and starting the environment on macOS.
- Run end-to-end verification by executing `./scripts/dev.sh` on a clean machine and note any OS-specific fixes.

Epic 2 will populate the `users` and `sessions` schema files and implement JWT authentication endpoints.
