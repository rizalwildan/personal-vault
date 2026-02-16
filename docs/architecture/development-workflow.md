# Development Workflow

## Local Development Setup

**Prerequisites:**
- Bun 1.x installed (`curl -fsSL https://bun.sh/install | bash`)
- Docker & Docker Compose (for PostgreSQL)
- pnpm 9.x (`npm install -g pnpm`)

**First-Time Setup:**

```bash
# 1. Clone repository
git clone <repo-url>
cd personal-vault

# 2. Install dependencies
pnpm install

# 3. Start PostgreSQL with Docker Compose
docker-compose up -d postgres

# 4. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 5. Run database migrations
pnpm db:migrate

# 6. Seed database (optional)
pnpm db:seed

# 7. Start development servers
pnpm dev
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

**Environment Variables:**

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/personal_vault
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: personal_vault_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: personal_vault
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: personal_vault_pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - '5050:80'
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## Git Workflow

**Branch Strategy:**
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

**Commit Convention:**
```
type(scope): subject

body

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Pre-commit Hooks:**
- TypeScript type checking
- ESLint linting
- Prettier formatting
- Unit test execution

---
