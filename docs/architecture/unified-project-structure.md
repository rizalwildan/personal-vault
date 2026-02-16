# Unified Project Structure

The monorepo contains both frontend and backend with shared schemas for type safety across the stack.

```
personal-vault/
├── frontend/                     # Next.js application
│   ├── app/                      # Next.js App Router
│   ├── components/               # React components
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utilities
│   ├── public/                   # Static assets
│   ├── package.json
│   └── tsconfig.json
├── backend/                      # Elysia.js application
│   ├── src/
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   ├── repositories/         # Data access
│   │   ├── middleware/           # Express middleware
│   │   ├── db/                   # Database schemas
│   │   └── index.ts              # Entry point
│   ├── package.json
│   └── tsconfig.json
├── shared/                       # Shared TypeScript code
│   ├── schemas/                  # Zod schemas (source of truth)
│   │   ├── user.ts
│   │   ├── note.ts
│   │   ├── tag.ts
│   │   └── session.ts
│   ├── types/                    # Shared TypeScript types
│   └── constants/                # Shared constants
├── docs/                         # Documentation
│   ├── architecture.md           # This file
│   ├── prd.md                    # Product requirements
│   ├── front-end-spec.md         # Frontend specification
│   └── design/                   # Design mockups
├── package.json                  # Root package.json (workspace)
├── pnpm-workspace.yaml           # pnpm workspace config
├── docker-compose.yml            # Local development stack
├── .gitignore
└── README.md
```

## Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'frontend'
  - 'backend'
  - 'shared'
```

```json
// Root package.json
{
  "name": "personal-vault",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter frontend --filter backend dev",
    "dev:frontend": "pnpm --filter frontend dev",
    "dev:backend": "pnpm --filter backend dev",
    "build": "pnpm --filter shared build && pnpm --parallel --filter frontend --filter backend build",
    "test": "pnpm --recursive test",
    "db:migrate": "pnpm --filter backend db:migrate",
    "db:seed": "pnpm --filter backend db:seed"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "5.7.3"
  }
}
```

---
