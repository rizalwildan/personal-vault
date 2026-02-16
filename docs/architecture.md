# BMad-Personal-Vault Fullstack Architecture Document

**Version:** 1.0
**Status:** Approved
**Last Updated:** February 16, 2026
**Author:** Winston (Architect - BMad Team)

---

## Introduction

This document outlines the complete fullstack architecture for BMad-Personal-Vault, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

The BMad-Personal-Vault is a self-hosted knowledge management system that enables solo developers to maintain a "second brain" of technical notes, coding standards, and solutions. These notes can be instantly injected into AI conversations within IDEs (Cursor, VS Code, Claude Desktop) through the Model Context Protocol (MCP). The system follows a **reactive interaction model** where AI only accesses the knowledge base when explicitly invoked via `@knowledge-base` commands, ensuring privacy and control.

### Starter Template or Existing Project

**Status:** Brownfield - Existing Frontend Implementation

This project has an **existing, fully-implemented Next.js 16 frontend** with complete UI implementation based on the [front-end-spec.md](front-end-spec.md). The frontend stack is production-ready and includes authentication, dashboard, notes management, and search interfaces.

**Existing Frontend Stack (Confirmed via Analysis):**
- **Next.js 16.1.6** with App Router and React Server Components (RSC)
- **React 19.2.3** (latest stable)
- **TypeScript 5.7.3**
- **Tailwind CSS 3.4** with @tailwindcss/typography for markdown styling
- **shadcn/ui** (complete component library - 40+ components based on Radix UI)
- **Lucide Icons** for iconography
- **react-markdown + remark-gfm + rehype-sanitize** for markdown rendering
- **react-hook-form + zod** for type-safe form validation
- **next-themes** for dark mode support
- **sonner** for toast notifications
- **pnpm** as package manager with React 19 overrides

**Frontend Architecture Highlights:**
- Route groups: `(auth)` for login/register, `(dashboard)` for authenticated pages
- Pages implemented: Dashboard, All Notes, Note Editor, Search, Login, Register
- Component organization: feature-based (`auth/`, `dashboard/`, `notes/`, `search/`)
- Custom hooks: `use-mobile`, `use-debounce`, `use-toast`
- Responsive design with mobile-first approach
- WCAG 2.1 Level AA accessibility compliance target

**Backend Stack (To Be Architected):**
- **Elysia.js on Bun** (TypeScript backend framework with @modelcontextprotocol/sdk for MCP support)
- **PostgreSQL 16+ with pgvector extension** (semantic search via vector embeddings)
- **Transformers.js** with multilingual model (Indonesian + English support, fully open source, JavaScript inference)
- **Docker Compose** (containerized deployment for local development and VPS)

**Embedding Model Selection:**
- **Model:** `paraphrase-multilingual-MiniLM-L12-v2` via `@xenova/transformers` (Transformers.js)
- **Rationale:** Supports 50+ languages including Indonesian and English, 384-dim vectors, ~120MB, fully open source, runs in JavaScript
- **Performance:** ~300-500ms per embedding (acceptable for non-real-time note creation)
- **Deployment:** Runs locally within Docker container, no API keys or subscriptions required
- **Note:** PRD mentioned `all-MiniLM-L6-v2` which is English-only; replaced with multilingual variant. Python sentence-transformers rejected in favor of TypeScript unity.

**Architectural Constraint:** The frontend is a complete brownfield implementation that fully realizes the UI/UX specification. The backend architecture must:
1. **Unified TypeScript Backend:** Single Elysia.js application exposing both REST API (for Next.js) and MCP protocol (for IDEs via @modelcontextprotocol/sdk)
2. **Shared Database:** PostgreSQL with pgvector accessed by both REST and MCP endpoints
3. **Dual Protocol Support:** HTTP REST for frontend, MCP over stdio/SSE for IDE clients
4. **Docker Compose:** Four services: frontend (Next.js), backend (Elysia.js/Bun), database (PostgreSQL+pgvector), optional nginx reverse proxy
5. **Type Safety End-to-End:** Direct Zod schema sharing between frontend and backend; no OpenAPI code generation needed

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-16 | 1.0 | Initial architecture document draft | Winston (Architect) |

---

## High Level Architecture

This section establishes the foundational architectural decisions for the BMad-Personal-Vault system, including deployment strategy, repository structure, system diagrams, and core architectural patterns.

### Technical Summary

BMad-Personal-Vault follows a **containerized microservices architecture** with a clear separation between presentation (Next.js frontend), business logic (Elysia.js backend on Bun), and data persistence (PostgreSQL with pgvector). The system is designed for **self-hosted deployment** with Docker Compose, enabling seamless transition from local development to cloud VPS environments. **Unified TypeScript** across the entire stack eliminates language context switching and enables direct type sharing.

The architecture employs a **dual-protocol backend approach** where a single Elysia.js application serves two distinct client types: (1) the Next.js web dashboard via REST API over HTTP/HTTPS, and (2) IDE clients (Cursor, VS Code, Claude Desktop) via the Model Context Protocol using @modelcontextprotocol/sdk over stdio or Server-Sent Events (SSE). This unified backend eliminates data synchronization issues and simplifies deployment topology.

**Frontend-Backend Integration:** The existing Next.js 16 frontend consumes RESTful JSON APIs exposed by the Elysia.js backend. Frontend routes (dashboard, notes CRUD, search) make asynchronous fetch requests to backend endpoints, which handle authentication, business logic, and database access. **Direct Zod schema sharing** ensures frontend and backend use identical type definitions, eliminating API contract drift. The frontend is stateless except for client-side caching and optimistic UI updates.

**Semantic Search Architecture:** All markdown notes are stored in PostgreSQL as plain text with metadata. Upon creation or update, notes are processed through the `paraphrase-multilingual-MiniLM-L12-v2` embedding model (supporting Indonesian and English) via **Transformers.js** (`@xenova/transformers`), generating 384-dimensional vectors stored in pgvector columns. Embedding generation runs asynchronously in the Bun runtime (~300-500ms per note). Search queries are similarly embedded, enabling semantic similarity search via cosine distance operations within PostgreSQL.

**MCP Integration:** The FastMCP server exposes notes as MCP resources accessible via the `@knowledge-base` command in supported IDEs. When invoked, the IDE connects to the MCP server (stdio for local, SSE for remote VPS), retrieves relevant notes based on semantic search, and injects context into the AI conversation. This is a **pull-based reactive model** where AI only accesses data upon explicit user request.

**Deployment Flexibility:** The Docker Compose configuration supports both local development (all services on localhost) and production VPS deployment (with nginx reverse proxy, SSL/TLS termination, and API key authentication). The same Docker images run in both environments with configuration managed via environment variables.

### Platform and Infrastructure Choice

**Platform:** Self-Hosted Docker Compose (Local Development + Cloud VPS)

**Rationale:** Given the self-hosted requirement (NFR3: data privacy) and need for portability between local and cloud environments (NFR1), Docker Compose provides the optimal balance of simplicity and flexibility. Alternative cloud platforms (Vercel, AWS, Azure) were considered but rejected due to cost constraints and vendor lock-in concerns.

**Key Services:**
1. **Frontend Service:** Next.js 16 application served via Node.js runtime (production build)
2. **Backend Service:** Elysia.js application on Bun runtime with REST API and MCP protocol support (@modelcontextprotocol/sdk)
3. **Database Service:** PostgreSQL 16 with pgvector extension for vector similarity search
4. **Reverse Proxy (Production):** Nginx for SSL termination, static asset serving, and load balancing

**Deployment Host and Regions:**
- **Local Development:** Docker Desktop (macOS/Linux/Windows) on developer machine
- **Production VPS:** Any Docker-capable VPS provider (DigitalOcean, Linode, Vultr, Hetzner)
- **Recommended Regions:** Southeast Asia (Singapore, Jakarta) for Indonesian users; optional multi-region for global access
- **Minimum Specs:** 2 vCPU, 4GB RAM, 20GB SSD (Transformers.js embedding model requires ~800MB memory at runtime; Bun runtime adds ~50MB)

**Infrastructure Services:**
- **Container Orchestration:** Docker Compose (v2.x)
- **Container Registry:** Docker Hub or GitHub Container Registry for image distribution
- **Secrets Management:** Docker secrets + environment variables (avoid hardcoding API keys)
- **Backup Strategy:** PostgreSQL pg_dump to S3-compatible storage or local volume snapshots

**Trade-offs vs Alternatives:**
- **vs Kubernetes:** Docker Compose is simpler for solo developers; K8s adds unnecessary complexity for this scale
- **vs Cloud PaaS (Vercel/Railway):** Self-hosted maintains data privacy and avoids subscription costs
- **vs Serverless (AWS Lambda):** FastMCP requires long-running process; cold starts unacceptable for IDE integration

### Repository Structure

**Structure:** Monorepo with pnpm workspaces

**Monorepo Tool:** pnpm workspaces (already in use by frontend)

**Package Organization:**
```
bmad-personal-vault/
├── frontend/                    # Next.js 16 application (existing)
│   ├── app/                     # App Router pages
│   ├── components/              # React components (shadcn/ui)
│   ├── lib/                     # Frontend utilities
│   ├── hooks/                   # Custom React hooks
│   ├── package.json             # Frontend dependencies
│   └── Dockerfile               # Multi-stage build for production
├── backend/                     # Elysia.js on Bun application (to be built)
│   ├── src/
│   │   ├── index.ts             # Elysia app entry point
│   │   ├── api/                 # REST API routes (Elysia handlers)
│   │   ├── mcp/                 # MCP server (@modelcontextprotocol/sdk)
│   │   ├── db/                  # Database client (Drizzle ORM or Prisma)
│   │   ├── services/            # Business logic layer
│   │   ├── ml/                  # Transformers.js embedding service
│   │   └── utils/               # Backend utilities
│   ├── tests/                   # Bun test suite (bun:test)
│   ├── package.json             # Bun dependencies
│   ├── tsconfig.json            # TypeScript config
│   └── Dockerfile               # FROM oven/bun:1
├── shared/                      # Shared types and schemas
│   ├── schemas/                 # Zod schemas (shared by frontend + backend)
│   └── types/                   # Shared TypeScript types
├── docker-compose.yml           # Local development environment
├── docker-compose.prod.yml      # Production overrides
├── .env.example                 # Environment variable template
├── docs/                        # Documentation (existing)
│   ├── architecture.md          # This document
│   ├── prd.md
│   └── front-end-spec.md
├── scripts/                     # Build and deployment scripts
│   ├── dev.sh                   # Start local development
│   ├── build.sh                 # Build Docker images
│   └── deploy.sh                # Deploy to VPS
└── pnpm-workspace.yaml          # Monorepo workspace config
```

**Rationale:**
- **Monorepo Benefits:** Unified versioning, shared types, atomic commits across frontend/backend
- **pnpm Workspaces:** Already used by frontend; Bun backend integrates seamlessly
- **Separate Docker Contexts:** Frontend (Node.js) and backend (Bun) have independent build processes and base images
- **Direct Type Sharing:** Zod schemas defined once in `/shared/schemas`, imported by both frontend and backend with zero code generation

**Simplified Type Sharing Workflow (No Build Tools!):**
1. Define Zod schema in `shared/schemas/note.ts`: `export const NoteSchema = z.object({...})`
2. Backend imports: `import { NoteSchema } from '@/shared/schemas/note'`
3. Frontend imports: `import { NoteSchema } from '@/shared/schemas/note'`
4. TypeScript types inferred automatically: `type Note = z.infer<typeof NoteSchema>`
5. Runtime validation with same schema: `NoteSchema.parse(data)`

**Key Simplification:** No OpenAPI spec, no code generation, no build step. Direct schema sharing via pnpm workspaces.

**Alternative Considered:** Turborepo for better caching and parallel builds, but pnpm workspaces is sufficient for this project scale

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "IDE Clients"
        A1[Cursor/VS Code<br/>Claude Desktop]
    end

    subgraph "Web Clients"
        B1[Browser<br/>Next.js Frontend]
    end

    subgraph "Docker Compose Environment"
        subgraph "Reverse Proxy (Production)"
            C1[Nginx<br/>SSL/TLS Termination]
        end

        subgraph "Frontend Service"
            D1[Next.js 16 App<br/>React Server Components]
            D2[Static Assets<br/>CSS/JS/Images]
        end

        subgraph "Backend Service"
            E1[Elysia.js Server<br/>Bun Runtime]
            E2[REST API Layer<br/>Elysia routes]
            E3[MCP Protocol Handler<br/>@modelcontextprotocol/sdk]
            E4[Embedding Service<br/>Transformers.js]
            E5[Business Logic<br/>CRUD, Search, Auth]
        end

        subgraph "Database Service"
            F1[(PostgreSQL 16<br/>with pgvector)]
            F2[Vector Embeddings<br/>384-dim]
        end
    end

    A1 -->|MCP Protocol<br/>stdio/SSE| C1
    B1 -->|HTTPS<br/>REST API| C1
    C1 -->|Port 3000| D1
    C1 -->|Port 8000| E1
    D1 -.->|Server Actions<br/>API Routes| E2
    E2 --> E5
    E3 --> E5
    E5 --> E4
    E5 --> F1
    E4 --> F1
    F1 --> F2

    style A1 fill:#e1f5ff
    style B1 fill:#e1f5ff
    style D1 fill:#d4edda
    style E1 fill:#fff3cd
    style F1 fill:#f8d7da
```

### Architectural Patterns

This section defines the core architectural patterns that guide both frontend and backend development, ensuring consistency and maintainability across the fullstack application.

#### Backend Patterns

- **Repository Pattern:** Abstract data access logic behind repository interfaces (e.g., `NotesRepository`, `UserRepository`). This enables testing with mock repositories and potential future database migration without touching business logic.

- **Service Layer Pattern:** Business logic encapsulated in service classes (e.g., `NotesService`, `EmbeddingService`, `SearchService`). Controllers/API routes remain thin, delegating to services for orchestration.

- **Dependency Injection:** Services and repositories injected via Elysia's decorator/plugin system or simple factory functions. Configuration, database connections, and external dependencies managed centrally via environment variables and singleton patterns.

- **Command Query Responsibility Segregation (CQRS) - Lite:** Separate read and write paths for semantic search. Write operations trigger async embedding generation; read operations query precomputed vectors for optimal performance. **Failure Handling:** Retry logic (3 attempts with exponential backoff) for transient failures; persistent failures trigger manual re-index flow via dashboard button.

#### Frontend Patterns

- **Component-Based UI:** Reusable React components with TypeScript for type safety. shadcn/ui provides atomic components; feature components compose them into complex UIs.

- **Server Components First:** Leverage Next.js 15+ React Server Components for data fetching and initial rendering. Client components only where interactivity requires browser APIs.

- **Progressive Enhancement:** Core functionality works without JavaScript; enhanced UX with client-side hydration and SPA-style navigation.

- **Optimistic UI Updates:** Immediate UI feedback on user actions (save, delete) with rollback on server errors. Reduces perceived latency.

#### Integration Patterns

- **Backend for Frontend (BFF) - Implicit:** Next.js API routes can act as BFF layer if needed, transforming backend responses into frontend-friendly shapes. Initially, direct REST consumption; add BFF layer if transformation logic grows.

- **API Gateway Pattern:** Nginx serves as edge gateway, routing `/api/*` to backend, static assets to frontend. Centralizes SSL, rate limiting, and CORS policies.

- **Event-Driven Indexing:** Note creation/update events trigger async embedding generation. Frontend polls or receives WebSocket notification when indexing completes.

---

## Tech Stack

This is the **DEFINITIVE** technology selection for the entire project. All development must use these exact versions to ensure consistency and compatibility across the fullstack application.

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Frontend Language** | TypeScript | 5.7.3 | Type-safe JavaScript for frontend development | Industry standard for large-scale React apps; catches bugs at compile time |
| **Frontend Framework** | Next.js | 16.1.6 | React framework with App Router and RSC | Latest stable version; App Router + RSC for optimal performance and DX |
| **Frontend Runtime** | React | 19.2.3 | UI component library | Latest stable React 19 with improved performance and new hooks |
| **UI Component Library** | shadcn/ui | Latest | Accessible, customizable component primitives | Built on Radix UI; copy-paste approach avoids dependency bloat; 40+ components already implemented |
| **UI Primitives** | Radix UI | 1.x (various) | Unstyled, accessible component primitives | Industry-leading accessibility (WCAG 2.1 AA); headless for full styling control |
| **CSS Framework** | Tailwind CSS | 3.4.17 | Utility-first CSS framework | Rapid UI development; tree-shaking for minimal bundle size; @tailwindcss/typography for markdown |
| **Icons** | Lucide Icons | 0.544.0 | Icon library | Lightweight, tree-shakeable, consistent 2px stroke width; 1000+ icons |
| **Markdown Rendering** | react-markdown | 9.0.0 | Markdown to React components | Secure rendering with rehype-sanitize; extensible with remark plugins |
| **Markdown Extensions** | remark-gfm | 4.0.0 | GitHub Flavored Markdown support | Tables, task lists, strikethrough for rich note formatting |
| **Markdown Sanitization** | rehype-sanitize | 6.0.0 | XSS protection for markdown | Prevents malicious HTML injection in user notes |
| **Form Management** | react-hook-form | 7.54.1 | Type-safe form validation | Minimal re-renders; integrates with zod for schema validation |
| **Schema Validation** | zod | 3.24.1 | TypeScript-first schema validation | Type inference; runtime validation; frontend + backend shared schemas |
| **Dark Mode** | next-themes | 0.4.6 | Theme management for Next.js | System preference detection; no flash of unstyled content |
| **Toasts** | sonner | 1.7.1 | Toast notification library | Beautiful, accessible toasts with minimal API surface |
| **Package Manager** | pnpm | Latest (9.x) | Fast, disk-efficient package manager | Already in use; 3x faster installs than npm; monorepo support |
| **Backend Runtime** | Bun | 1.x | JavaScript/TypeScript runtime | 3x faster than Node.js; native TypeScript; built-in testing; minimal Docker image |
| **Backend Language** | TypeScript | 5.7.3 | Type-safe backend development | Unified language across fullstack; same version as frontend |
| **Backend Framework** | Elysia.js | Latest | Type-safe web framework for Bun | Fastest TypeScript framework; built-in validation; excellent DX |
| **MCP SDK** | @modelcontextprotocol/sdk | Latest | Official MCP protocol implementation | TypeScript SDK from Anthropic; stdio and SSE transports |
| **Database** | PostgreSQL | 16+ | Primary relational database | Industry-standard RDBMS; ACID compliance; excellent JSON support |
| **Vector Extension** | pgvector | 0.6.0+ | Vector similarity search in PostgreSQL | Native PostgreSQL extension; cosine distance for semantic search |
| **ORM** | Drizzle ORM | Latest | Type-safe TypeScript ORM | Zero-runtime overhead; SQL-like API; excellent TypeScript inference; Bun-compatible |
| **Embedding Model** | paraphrase-multilingual-MiniLM-L12-v2 | @xenova/transformers | Multilingual text embeddings (ID + EN) | 384-dim vectors; 50+ languages; ~120MB; fully open source; JavaScript inference via ONNX |
| **ML Framework** | Transformers.js | Latest (@xenova/transformers) | JavaScript ML inference | Hugging Face models in JavaScript; ONNX runtime; CPU-optimized; ~300-500ms embeddings |
| **Authentication** | Custom JWT + PostgreSQL | N/A | User authentication | Simple JWT tokens; no external auth provider needed for self-hosted |
| **API Style** | REST (JSON) | Zod Schemas | Frontend-backend communication | Simple, stateless, type-safe; direct Zod schema sharing (no code generation) |
| **Frontend Testing** | Vitest + Testing Library | Latest | Unit and integration tests for React | Fast, Jest-compatible; React Testing Library for user-centric tests |
| **Backend Testing** | Bun Test | Built-in | Unit and integration tests for backend | Built into Bun runtime; Jest-compatible API; fast execution |
| **E2E Testing** | Playwright | Latest | End-to-end browser tests | Cross-browser; auto-wait; parallel execution |
| **Build Tool (Frontend)** | Next.js Compiler (SWC) | Built-in | Fast Rust-based compiler | 3x faster than Babel; built into Next.js |
| **Bundler** | Turbopack | Built-in (Next.js 16) | Fast incremental bundler | Rust-based; 700x faster HMR than Webpack |
| **IaC Tool** | Docker Compose | 2.x | Infrastructure definition | Simple YAML; reproducible environments; local + VPS support |
| **CI/CD** | GitHub Actions | N/A | Continuous integration and deployment | Free for public repos; Docker build + deploy workflows |
| **Monitoring** | Minimal (Logs + Health Checks) | N/A | Application observability | Self-hosted; stdout logs + `/health` endpoints; no external services |
| **Logging** | Pino (or Bun console) | Latest | Structured logging | JSON logs to stdout; fast; optional Grafana Loki for aggregation |
| **Reverse Proxy** | Nginx | 1.25+ | SSL termination and static serving | Battle-tested; efficient static file serving; Let's Encrypt integration |
| **Container Runtime** | Docker | 24+ | Application containerization | Industry standard; reproducible builds; multi-stage for optimization |

---

## Data Models

This section defines the core data models and their relationships. Models are defined using **Zod schemas** (shared between frontend and backend) and implemented in **PostgreSQL with pgvector** via Drizzle ORM.

### Model: User

**Purpose:** Represents authenticated users who own notes. Supports basic authentication with JWT tokens. Self-hosted system assumes single-user or small team usage.

**Key Attributes:**
- `id`: UUID - Primary key, auto-generated
- `email`: string - Unique email address for login
- `password_hash`: string - Bcrypt-hashed password (never exposed to frontend)
- `name`: string - Display name
- `created_at`: timestamp - Account creation timestamp
- `updated_at`: timestamp - Last profile update timestamp

#### Zod Schema

```typescript
// shared/schemas/user.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatar_url: z.string().url().optional(), // Optional profile picture URL
  terms_accepted_at: z.date().optional(), // Timestamp when user accepted terms
  created_at: z.date(),
  updated_at: z.date(),
});

// Frontend-safe user (no password_hash)
export type User = z.infer<typeof UserSchema>;

// Backend-only user with password
export const UserWithPasswordSchema = UserSchema.extend({
  password_hash: z.string(),
});

export type UserWithPassword = z.infer<typeof UserWithPasswordSchema>;

// Registration/login schemas
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
```

#### Drizzle Schema (PostgreSQL)

```typescript
// backend/src/db/schema/users.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Relationships

- **User → Notes:** One-to-many (one user owns many notes)
- **User → Tags:** One-to-many (one user owns many tags)

---

### Model: Note

**Purpose:** Core entity representing a markdown note with metadata and vector embeddings for semantic search. Notes are the primary data accessed via MCP protocol.

**Key Attributes:**
- `id`: UUID - Primary key
- `user_id`: UUID - Foreign key to users table
- `title`: string - Note title (required, max 200 chars)
- `content`: text - Markdown content (unlimited length)
- `embedding`: vector(384) - pgvector column for semantic search
- `embedding_status`: enum - Status of embedding generation ('pending', 'processing', 'completed', 'failed')
- `tags`: string[] - Array of tag names (denormalized for query performance)
- `is_archived`: boolean - Soft delete flag
- `created_at`: timestamp
- `updated_at`: timestamp

#### Zod Schema

```typescript
// shared/schemas/note.ts
import { z } from 'zod';

export const EmbeddingStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

export const NoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string(),
  embedding_status: EmbeddingStatusSchema,
  tags: z.array(z.string()).default([]),
  is_archived: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Note = z.infer<typeof NoteSchema>;

// Create/update schemas (frontend → backend)
export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string()).optional(),
});

export const UpdateNoteSchema = CreateNoteSchema.partial();

export type CreateNote = z.infer<typeof CreateNoteSchema>;
export type UpdateNote = z.infer<typeof UpdateNoteSchema>;
```

#### Drizzle Schema (PostgreSQL)

```typescript
// backend/src/db/schema/notes.ts
import { pgTable, uuid, varchar, text, timestamp, boolean, vector } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 384 }), // pgvector column
  embedding_status: varchar('embedding_status', { length: 20 }).notNull().default('pending'),
  tags: text('tags').array().notNull().default([]), // PostgreSQL text array
  is_archived: boolean('is_archived').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Indexes for performance
export const notesIndexes = {
  user_id_idx: index('notes_user_id_idx').on(notes.user_id),
  embedding_idx: index('notes_embedding_idx').using('hnsw', notes.embedding.cosineDistance()),
  tags_idx: index('notes_tags_idx').using('gin', notes.tags),
  created_at_idx: index('notes_created_at_idx').on(notes.created_at.desc()),
};
```

#### Relationships

- **Note → User:** Many-to-one (many notes belong to one user)
- **Note → Tags:** Many-to-many (denormalized as array for simplicity)

---

### Model: Tag

**Purpose:** Simple categorization system for notes. Tags are lightweight labels that help organize and filter notes. Denormalized in notes table for query performance.

**Key Attributes:**
- `id`: UUID - Primary key
- `user_id`: UUID - Foreign key to users
- `name`: string - Tag name (unique per user)
- `color`: string - Hex color for UI display (optional)
- `created_at`: timestamp

#### Zod Schema

```typescript
// shared/schemas/tag.ts
import { z } from 'zod';

export const TagSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  created_at: z.date(),
});

export type Tag = z.infer<typeof TagSchema>;

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});
```

#### Drizzle Schema (PostgreSQL)

```typescript
// backend/src/db/schema/tags.ts
import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }), // #RRGGBB
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one user can't have duplicate tag names
  unique_user_tag: unique().on(table.user_id, table.name),
}));
```

#### Relationships

- **Tag → User:** Many-to-one
- **Tag ↔ Note:** Many-to-many (via denormalized array in notes.tags)

---

### Model: Session

**Purpose:** Track active JWT sessions for token revocation and security auditing. Enables logout functionality and session management.

**Key Attributes:**
- `id`: UUID - Primary key
- `user_id`: UUID - Foreign key to users
- `token_hash`: string - SHA-256 hash of JWT refresh token
- `expires_at`: timestamp - Session expiry
- `created_at`: timestamp

#### Zod Schema

```typescript
// shared/schemas/session.ts
import { z } from 'zod';

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  expires_at: z.date(),
  created_at: z.date(),
});

export type Session = z.infer<typeof SessionSchema>;
```

#### Drizzle Schema (PostgreSQL)

```typescript
// backend/src/db/schema/sessions.ts
import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  token_hash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  user_id_idx: index('sessions_user_id_idx').on(table.user_id),
  expires_at_idx: index('sessions_expires_at_idx').on(table.expires_at),
}));
```

#### Relationships

- **Session → User:** Many-to-one (one user can have multiple active sessions)

---

### Complete Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Note : owns
    User ||--o{ Tag : creates
    User ||--o{ Session : has
    Note }o--o{ Tag : "has (denormalized)"

    User {
        uuid id PK
        string email UK
        string password_hash
        string name
        string avatar_url
        timestamp terms_accepted_at
        timestamp created_at
        timestamp updated_at
    }

    Note {
        uuid id PK
        uuid user_id FK
        string title
        text content
        vector_384 embedding
        enum embedding_status
        string_array tags
        boolean is_archived
        timestamp created_at
        timestamp updated_at
    }

    Tag {
        uuid id PK
        uuid user_id FK
        string name
        string color
        timestamp created_at
    }

    Session {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        timestamp expires_at
        timestamp created_at
    }
```

---

### Database Indexes Strategy

**Performance-Critical Indexes:**

1. **notes.embedding (HNSW):** Fast approximate nearest neighbor search for semantic similarity
2. **notes.tags (GIN):** Fast array containment queries for tag filtering
3. **notes.user_id + created_at:** Composite index for user's recent notes
4. **sessions.token_hash:** Fast session lookup during authentication

**Index Trade-offs:**
- HNSW index for pgvector adds ~30% storage overhead but enables <50ms vector search
- GIN index on tags array adds ~20% overhead but enables instant tag filtering
- Acceptable for knowledge base with estimated <10K notes per user

---

## API Specification

This section defines the complete REST API contract for the backend service. All endpoints use JSON for request/response bodies unless otherwise specified. The API follows RESTful conventions and uses standard HTTP status codes.

### Base Configuration

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** Bearer JWT token in `Authorization` header
```
Authorization: Bearer <access_token>
```

**Response Format:** All endpoints return JSON with consistent structure:
```typescript
// Success response
{
  success: true,
  data: T // Type varies by endpoint
}

// Error response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

---

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Request:**
```typescript
{
  email: string;      // Valid email format
  password: string;   // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
  name: string;       // 1-100 characters
  terms_accepted: boolean; // Must be true
}
```

**Response (201 Created):**
```typescript
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      terms_accepted_at: string; // ISO 8601
      created_at: string;
      updated_at: string;
    },
    access_token: string;  // JWT valid for 1 hour
    refresh_token: string; // JWT valid for 30 days
  }
}
```

**Errors:**
- `409 Conflict` - Email already registered
- `400 Bad Request` - Validation errors (weak password, invalid email, terms not accepted)

---

#### POST /auth/login

Authenticate existing user.

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      terms_accepted_at: string;
      created_at: string;
      updated_at: string;
    },
    access_token: string;
    refresh_token: string;
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing fields

---

#### POST /auth/logout

Invalidate current session (revoke refresh token).

**Request:**
```typescript
{
  refresh_token: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: null
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired token

---

#### POST /auth/refresh

Exchange refresh token for new access token.

**Request:**
```typescript
{
  refresh_token: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    access_token: string;  // New access token
    refresh_token: string; // Same or new refresh token
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### Note Endpoints

#### GET /notes

List all notes for authenticated user with optional filtering.

**Query Parameters:**
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 50, Max: 100
  tags?: string[];      // Filter by tag names (comma-separated)
  archived?: boolean;   // Default: false
  sort?: 'created_at' | 'updated_at' | 'title'; // Default: created_at
  order?: 'asc' | 'desc'; // Default: desc
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    notes: Array<{
      id: string;
      user_id: string;
      title: string;
      content: string;
      embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
      tags: string[];
      is_archived: boolean;
      created_at: string;
      updated_at: string;
    }>,
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    }
  }
}
```

---

#### GET /notes/:id

Retrieve a single note by ID.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    title: string;
    content: string;
    embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
    tags: string[];
    is_archived: boolean;
    created_at: string;
    updated_at: string;
  }
}
```

**Errors:**
- `404 Not Found` - Note doesn't exist or doesn't belong to user

---

#### POST /notes

Create a new note. Triggers async embedding generation.

**Request:**
```typescript
{
  title: string;      // 1-200 characters
  content: string;    // 1-100,000 characters
  tags?: string[];    // Optional, array of tag names
}
```

**Response (201 Created):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    title: string;
    content: string;
    embedding_status: 'pending'; // Initial status
    tags: string[];
    is_archived: boolean;
    created_at: string;
    updated_at: string;
  }
}
```

**Errors:**
- `400 Bad Request` - Validation errors (title too long, content empty, etc.)

---

#### PATCH /notes/:id

Update existing note. Triggers re-indexing if content changed.

**Request:**
```typescript
{
  title?: string;
  content?: string;
  tags?: string[];      // Replaces existing tags
  is_archived?: boolean;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    title: string;
    content: string;
    embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
    tags: string[];
    is_archived: boolean;
    created_at: string;
    updated_at: string;
  }
}
```

**Errors:**
- `404 Not Found` - Note doesn't exist or doesn't belong to user
- `400 Bad Request` - Validation errors

---

#### DELETE /notes/:id

Permanently delete a note.

**Response (200 OK):**
```typescript
{
  success: true,
  data: null
}
```

**Errors:**
- `404 Not Found` - Note doesn't exist or doesn't belong to user

---

#### POST /notes/:id/reindex

Manually trigger re-indexing for a failed embedding.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    message: 'Re-indexing triggered',
    embedding_status: 'pending'
  }
}
```

**Errors:**
- `404 Not Found` - Note doesn't exist or doesn't belong to user

---

### Search Endpoint

#### POST /search

Perform semantic search across user's notes.

**Request:**
```typescript
{
  query: string;        // 1-500 characters
  limit?: number;       // Default: 10, Max: 50
  threshold?: number;   // Similarity threshold 0.0-1.0, Default: 0.7
  tags?: string[];      // Optional tag filter
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    results: Array<{
      note: {
        id: string;
        user_id: string;
        title: string;
        content: string;
        tags: string[];
        created_at: string;
        updated_at: string;
      },
      similarity: number;  // 0.0 to 1.0
      rank: number;        // 1 to limit
    }>,
    query_metadata: {
      query: string;
      processing_time_ms: number;
      total_results: number;
    }
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid query or parameters

---

### Tag Endpoints

#### GET /tags

List all tags for authenticated user.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    tags: Array<{
      id: string;
      user_id: string;
      name: string;
      color: string | null;  // Hex color code
      note_count: number;    // Number of notes with this tag
      created_at: string;
    }>
  }
}
```

---

#### POST /tags

Create a new tag.

**Request:**
```typescript
{
  name: string;     // 1-50 characters, unique per user
  color?: string;   // Optional hex color (#RRGGBB)
}
```

**Response (201 Created):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    name: string;
    color: string | null;
    created_at: string;
  }
}
```

**Errors:**
- `409 Conflict` - Tag name already exists for user
- `400 Bad Request` - Validation errors

---

#### PATCH /tags/:id

Update tag name or color.

**Request:**
```typescript
{
  name?: string;
  color?: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    name: string;
    color: string | null;
    created_at: string;
  }
}
```

**Errors:**
- `404 Not Found` - Tag doesn't exist or doesn't belong to user
- `409 Conflict` - New name already exists
- `400 Bad Request` - Validation errors

---

#### DELETE /tags/:id

Delete a tag. Notes with this tag will have it removed from their tags array.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    message: 'Tag deleted',
    notes_updated: number;  // Count of notes that had this tag removed
  }
}
```

**Errors:**
- `404 Not Found` - Tag doesn't exist or doesn't belong to user

---

### MCP Protocol Endpoints

These endpoints implement the Model Context Protocol for AI assistant integration.

#### POST /mcp/messages

MCP message handler for stdio/SSE transport.

**Request:**
```typescript
{
  jsonrpc: '2.0',
  id: string | number,
  method: string,
  params?: unknown
}
```

**Supported Methods:**
- `initialize` - Initialize MCP session
- `tools/list` - List available MCP tools
- `tools/call` - Execute MCP tool
- `resources/list` - List user's notes as resources
- `resources/read` - Read specific note content

**Response (200 OK):**
```typescript
{
  jsonrpc: '2.0',
  id: string | number,
  result?: unknown,
  error?: {
    code: number,
    message: string,
    data?: unknown
  }
}
```

---

#### GET /mcp/sse

Server-Sent Events endpoint for MCP streaming transport.

**Response:** `text/event-stream`
```
event: message
data: {"jsonrpc":"2.0","method":"notifications/initialized","params":{}}

event: message
data: {"jsonrpc":"2.0","method":"resources/updated","params":{}}
```

---

### Health & Status Endpoints

#### GET /health

Check service health status.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    status: 'healthy',
    timestamp: string,
    database: {
      status: 'connected',
      latency_ms: number
    },
    embedding_service: {
      status: 'ready' | 'loading' | 'error',
      model: string
    }
  }
}
```

---

#### GET /stats

Get user statistics for dashboard.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    total_notes: number,
    archived_notes: number,
    total_tags: number,
    embedding_status: {
      completed: number,
      pending: number,
      processing: number,
      failed: number
    },
    database_health: number,  // 0-100 percentage
    last_sync: string | null, // ISO 8601
    storage_used_mb: number
  }
}
```

---

## Components

This section describes the major code components (modules, services, libraries) that form the building blocks of both frontend and backend. Each component has a clear responsibility and interface.

### Backend Components

#### 1. Authentication Service (`backend/src/services/auth.service.ts`)

**Responsibility:** User authentication, JWT token generation/validation, password hashing.

**Key Methods:**
- `register(email, password, name, terms_accepted)` → `{ user, access_token, refresh_token }`
- `login(email, password)` → `{ user, access_token, refresh_token }`
- `logout(refresh_token)` → `void`
- `refreshToken(refresh_token)` → `{ access_token, refresh_token }`
- `validateAccessToken(token)` → `{ user_id, email }`

**Dependencies:**
- `bcrypt` - Password hashing (cost factor: 12)
- `jsonwebtoken` - JWT signing and verification
- `UserRepository` - Database access
- `SessionRepository` - Session management

**Configuration:**
- JWT secret from environment variable `JWT_SECRET`
- Access token expiry: 1 hour
- Refresh token expiry: 30 days

---

#### 2. Notes Service (`backend/src/services/notes.service.ts`)

**Responsibility:** CRUD operations for notes, orchestrate embedding generation.

**Key Methods:**
- `create(user_id, title, content, tags)` → `Note`
- `update(note_id, user_id, updates)` → `Note`
- `delete(note_id, user_id)` → `void`
- `getById(note_id, user_id)` → `Note | null`
- `list(user_id, filters, pagination)` → `{ notes, pagination }`
- `triggerReindex(note_id, user_id)` → `void`

**Dependencies:**
- `NotesRepository` - Database access
- `EmbeddingService` - Async embedding generation
- `TagService` - Tag validation and creation

**Business Logic:**
- On create/update: Set `embedding_status = 'pending'`, trigger async embedding
- On tag assignment: Auto-create tags if they don't exist
- On delete: Cascade delete embeddings (handled by database)

---

#### 3. Embedding Service (`backend/src/services/embedding.service.ts`)

**Responsibility:** Generate multilingual embeddings using Transformers.js, manage embedding lifecycle.

**Key Methods:**
- `initialize()` → Load model on startup
- `generateEmbedding(text)` → `Float32Array` (384 dimensions)
- `processNote(note_id)` → Update embedding in database with retry logic
- `getModelInfo()` → `{ name, dimensions, status }`

**Implementation Details:**
```typescript
import { pipeline } from '@xenova/transformers';

class EmbeddingService {
  private model: any;
  private readonly MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  
  async initialize() {
    this.model = await pipeline('feature-extraction', this.MODEL_NAME);
  }
  
  async generateEmbedding(text: string): Promise<Float32Array> {
    const output = await this.model(text, { pooling: 'mean', normalize: true });
    return output.data; // 384-dim vector
  }
  
  async processNote(note_id: string, retryCount = 0) {
    try {
      const note = await this.notesRepo.getById(note_id);
      const embedding = await this.generateEmbedding(note.content);
      await this.notesRepo.updateEmbedding(note_id, embedding, 'completed');
    } catch (error) {
      if (retryCount < 3) {
        // Exponential backoff
        await sleep(Math.pow(2, retryCount) * 1000);
        return this.processNote(note_id, retryCount + 1);
      }
      await this.notesRepo.updateEmbeddingStatus(note_id, 'failed');
    }
  }
}
```

**Configuration:**
- Model cache directory: `backend/.cache/transformers`
- Max concurrent embedding jobs: 5
- Retry attempts: 3 with exponential backoff

**Performance:**
- Initial model load: ~2-3 seconds
- Embedding generation: 300-500ms per note (depending on length)
- Memory usage: ~200MB model + ~50MB per concurrent job

---

#### 4. Search Service (`backend/src/services/search.service.ts`)

**Responsibility:** Semantic search using pgvector cosine similarity.

**Key Methods:**
- `semanticSearch(user_id, query, limit, threshold, tags)` → `SearchResult[]`
- `getSearchStats(user_id)` → `{ total_indexed, pending, failed }`

**Implementation:**
```typescript
async semanticSearch(
  user_id: string,
  query: string,
  limit: number = 10,
  threshold: number = 0.7,
  tags?: string[]
) {
  const query_embedding = await this.embeddingService.generateEmbedding(query);
  
  // Use Drizzle with pgvector extension
  const results = await db
    .select({
      note: notes,
      similarity: sql`1 - (${notes.embedding} <=> ${query_embedding})` // Cosine similarity
    })
    .from(notes)
    .where(
      and(
        eq(notes.user_id, user_id),
        eq(notes.embedding_status, 'completed'),
        eq(notes.is_archived, false),
        sql`1 - (${notes.embedding} <=> ${query_embedding}) >= ${threshold}`,
        tags ? sql`${notes.tags} @> ARRAY[${tags}]::text[]` : undefined
      )
    )
    .orderBy(sql`${notes.embedding} <=> ${query_embedding}`)
    .limit(limit);
    
  return results;
}
```

**Dependencies:**
- `EmbeddingService` - Query embedding generation
- `NotesRepository` - Database access with pgvector

---

#### 5. MCP Service (`backend/src/services/mcp.service.ts`)

**Responsibility:** Model Context Protocol implementation for AI assistant integration.

**Key Methods:**
- `handleRequest(user_id, jsonrpc_request)` → `jsonrpc_response`
- `listTools()` → MCP tool definitions
- `executeTool(tool_name, params)` → tool result
- `listResources(user_id)` → User's notes as MCP resources
- `readResource(user_id, resource_uri)` → Note content

**MCP Tools Exposed:**
1. **search_notes** - Semantic search with natural language
2. **create_note** - Create new note
3. **update_note** - Update existing note
4. **list_tags** - List available tags

**Dependencies:**
- `@modelcontextprotocol/sdk` - Official MCP SDK
- `NotesService` - Note operations
- `SearchService` - Semantic search

---

#### 6. Repository Layer

**Pattern:** Each entity has a dedicated repository for data access.

**Repositories:**

##### `UserRepository` (`backend/src/repositories/user.repository.ts`)
- `create(email, password_hash, name, terms_accepted_at)` → `User`
- `findByEmail(email)` → `User | null`
- `findById(id)` → `User | null`
- `update(id, updates)` → `User`

##### `NotesRepository` (`backend/src/repositories/notes.repository.ts`)
- `create(user_id, note_data)` → `Note`
- `update(id, updates)` → `Note`
- `delete(id)` → `void`
- `findById(id)` → `Note | null`
- `findByUser(user_id, filters, pagination)` → `{ notes, total }`
- `updateEmbedding(id, embedding, status)` → `void`

##### `TagRepository` (`backend/src/repositories/tag.repository.ts`)
- `create(user_id, name, color)` → `Tag`
- `update(id, updates)` → `Tag`
- `delete(id)` → `number` (affected notes count)
- `findByUser(user_id)` → `Tag[]`
- `findOrCreate(user_id, name)` → `Tag`

##### `SessionRepository` (`backend/src/repositories/session.repository.ts`)
- `create(user_id, token_hash, expires_at)` → `Session`
- `findByTokenHash(hash)` → `Session | null`
- `delete(token_hash)` → `void`
- `deleteExpired()` → `number` (deleted count)

---

### Frontend Components

#### 1. Authentication Components

**Location:** `frontend/app/(auth)/`

##### `LoginForm` (`components/auth/login-form.tsx`)
- Email/password form with validation
- "Remember me" checkbox
- Error handling with toast notifications
- Redirects to dashboard on success

##### `RegisterForm` (`components/auth/register-form.tsx`)
- Full name, email, password, confirm password fields
- Terms of Service acceptance checkbox
- Password strength indicator
- Error handling with inline validation

##### `AuthProvider` (`components/providers/auth-provider.tsx`)
- Context provider for auth state
- JWT token management (localStorage)
- Auto-refresh tokens before expiry
- Logout function

---

#### 2. Dashboard Components

**Location:** `frontend/app/(dashboard)/`

##### `DashboardStats` (`components/dashboard/dashboard-stats.tsx`)
- Display total notes, database health, last sync
- Real-time updates via SWR
- Loading skeletons for stats

##### `RecentNotes` (`components/dashboard/recent-notes.tsx`)
- List of 5 most recent notes
- Click to navigate to editor
- Empty state message

##### `MCPConnectionStatus` (`components/dashboard/mcp-status.tsx`)
- MCP server connection indicator
- Reconnect button on failure
- Status colors: green (connected), red (disconnected), yellow (connecting)

---

#### 3. Notes Components

**Location:** `frontend/app/(dashboard)/notes/`

##### `NotesList` (`components/notes/notes-list.tsx`)
- Grid/list view of all notes
- Filter by tags, sort by date/title
- Search bar (triggers semantic search)
- Pagination controls
- Loading states with skeletons

##### `NoteCard` (`components/notes/note-card.tsx`)
- Title, excerpt (first 150 chars), tags
- Created/updated timestamps
- Edit and delete buttons
- Embedding status badge

##### `NoteEditor` (`components/notes/note-editor.tsx`)
- Split view: Markdown editor + preview
- Auto-save every 30 seconds
- Character count (0/100,000)
- Tag selector with autocomplete
- Save & Close button

##### `MarkdownPreview` (`components/notes/markdown-preview.tsx`)
- Renders markdown with react-markdown
- GFM support (tables, task lists, strikethrough)
- Syntax highlighting for code blocks
- Sanitized output (rehype-sanitize)

##### `TagSelector` (`components/notes/tag-selector.tsx`)
- Multi-select combobox
- Create new tags inline
- Color picker for tags
- Displays selected tags as badges

---

#### 4. Search Components

##### `SearchBar` (`components/search/search-bar.tsx`)
- Debounced input (300ms)
- Loading spinner during search
- Keyboard shortcut (Cmd/Ctrl + K)
- Clear button

##### `SearchResults` (`components/search/search-results.tsx`)
- List of matching notes with similarity scores
- Highlighted query terms
- Empty state: "No results found"
- Click to open note in editor

---

#### 5. Shared Components (shadcn/ui)

These components are already implemented in `frontend/components/ui/`:

- `Button`, `Input`, `Textarea`, `Label`
- `Card`, `Badge`, `Avatar`, `Separator`
- `Dialog`, `AlertDialog`, `Popover`, `Tooltip`
- `Select`, `Combobox`, `Checkbox`, `Switch`
- `Toast` (sonner integration)
- `Skeleton` (loading states)
- `ResizablePanel` (split view)

---

#### 6. Hooks

**Location:** `frontend/hooks/`

##### `useAuth()` (`hooks/use-auth.ts`)
- Returns `{ user, login, logout, register, isLoading, isAuthenticated }`
- Manages auth state and token refresh

##### `useNotes()` (`hooks/use-notes.ts`)
- Returns `{ notes, createNote, updateNote, deleteNote, reindexNote, isLoading, error }`
- SWR-based data fetching with optimistic updates

##### `useSearch()` (`hooks/use-search.ts`)
- Returns `{ search, results, isLoading, clear }`
- Debounced semantic search

##### `useTags()` (`hooks/use-tags.ts`)
- Returns `{ tags, createTag, updateTag, deleteTag, isLoading }`
- Tag management with cache invalidation

---

## External APIs

This section documents all third-party services and external APIs the system integrates with.

### None (Fully Offline)

**Rationale:** Per NFR3 (Self-hosted) and NFR4 (Simple security), this system has **zero external dependencies** for core functionality:

- **No OAuth providers** - Custom JWT authentication only
- **No cloud AI APIs** - Transformers.js runs locally
- **No analytics** - Privacy-focused, no tracking
- **No CDNs** - All assets self-hosted
- **No email services** - Future feature, not MVP

**Future Considerations:**
If external integrations are added in v2.0+, consider:
1. **Email service** (Resend, SendGrid) - Password reset, notifications
2. **Object storage** (S3, MinIO) - File attachments for notes
3. **Monitoring** (Sentry, Axiom) - Error tracking (opt-in only)

---


## Core Workflows

This section describes the critical user flows and system processes, showing how components interact to deliver functionality.

### 1. User Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Fill registration form
    Frontend->>Frontend: Validate inputs (zod)
    Frontend->>Backend: POST /auth/register
    Backend->>Backend: Hash password (bcrypt)
    Backend->>Database: INSERT user
    Database-->>Backend: User created
    Backend->>Backend: Generate JWT tokens
    Backend->>Database: INSERT session
    Backend-->>Frontend: { user, tokens }
    Frontend->>Frontend: Store tokens (localStorage)
    Frontend->>User: Redirect to dashboard
```

**Steps:**
1. User fills form: name, email, password, accept terms
2. Frontend validates with `RegisterSchema` (zod)
3. Backend hashes password with bcrypt (cost: 12)
4. Backend creates user record with `terms_accepted_at = NOW()`
5. Backend generates access token (1h) and refresh token (30d)
6. Backend creates session record with hashed refresh token
7. Frontend stores tokens in localStorage
8. Frontend redirects to `/dashboard`

**Error Handling:**
- Email already exists → Show "Email already registered" error
- Weak password → Show password requirements
- Terms not accepted → Disable submit button

---

### 2. Create Note with Embedding Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant EmbeddingService
    participant Database

    User->>Frontend: Write note, click Save
    Frontend->>Backend: POST /notes { title, content, tags }
    Backend->>Database: INSERT note (status=pending)
    Database-->>Backend: Note created
    Backend->>Backend: Queue embedding job
    Backend-->>Frontend: Note (status=pending)
    Frontend->>User: Show "Indexing..." badge
    
    par Async Embedding
        Backend->>EmbeddingService: processNote(note_id)
        EmbeddingService->>EmbeddingService: Load content
        EmbeddingService->>EmbeddingService: Generate embedding (300-500ms)
        EmbeddingService->>Database: UPDATE note.embedding (status=completed)
    end
    
    Frontend->>Backend: Poll /notes/:id (every 5s)
    Backend->>Database: SELECT note
    Database-->>Backend: Note (status=completed)
    Backend-->>Frontend: Note (status=completed)
    Frontend->>User: Remove "Indexing..." badge
```

**Steps:**
1. User writes note in editor, clicks "Save"
2. Frontend validates and sends POST request
3. Backend creates note with `embedding_status = 'pending'`
4. Backend queues async embedding job (returns immediately)
5. Frontend shows note with "Indexing..." badge
6. **Async:** EmbeddingService generates 384-dim vector
7. **Async:** Database updated with embedding, status = 'completed'
8. Frontend polls every 5 seconds until status = 'completed'

**Retry Logic:**
- If embedding fails (timeout, OOM), retry 3 times with exponential backoff
- After 3 failures, set `embedding_status = 'failed'`
- User can manually trigger re-index via dashboard button

---

### 3. Semantic Search Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant EmbeddingService
    participant Database

    User->>Frontend: Type query in search bar
    Frontend->>Frontend: Debounce 300ms
    Frontend->>Backend: POST /search { query, limit, threshold }
    Backend->>EmbeddingService: generateEmbedding(query)
    EmbeddingService-->>Backend: query_vector (384-dim)
    Backend->>Database: SELECT with pgvector <=> (cosine similarity)
    Database-->>Backend: Matching notes with similarity scores
    Backend->>Backend: Filter by threshold (0.7)
    Backend-->>Frontend: { results, metadata }
    Frontend->>User: Display results with similarity scores
```

**Steps:**
1. User types query in search bar
2. Frontend debounces input (300ms) to avoid excessive requests
3. Backend generates embedding for query string
4. Database executes vector similarity search:
   ```sql
   SELECT *, 1 - (embedding <=> $1) AS similarity
   FROM notes
   WHERE user_id = $2
     AND embedding_status = 'completed'
     AND 1 - (embedding <=> $1) >= 0.7
   ORDER BY embedding <=> $1
   LIMIT 10
   ```
5. Results ranked by similarity (0.0 to 1.0)
6. Frontend displays with similarity percentage

**Performance:**
- Query embedding: 300-500ms
- Vector search: <50ms (HNSW index)
- Total: <600ms (meets NFR2: <2s)

---

### 4. MCP Integration Flow

```mermaid
sequenceDiagram
    participant AIAssistant
    participant MCP_Client
    participant Backend
    participant Database

    AIAssistant->>MCP_Client: Request: "Search my notes about Python"
    MCP_Client->>Backend: POST /mcp/messages (tools/call: search_notes)
    Backend->>Database: Semantic search
    Database-->>Backend: Matching notes
    Backend-->>MCP_Client: JSON-RPC response with notes
    MCP_Client->>AIAssistant: Present notes as context
    AIAssistant->>MCP_Client: Request: "Create note with summary"
    MCP_Client->>Backend: POST /mcp/messages (tools/call: create_note)
    Backend->>Database: INSERT note
    Backend-->>MCP_Client: JSON-RPC response with note_id
    MCP_Client->>AIAssistant: Confirm note created
```

**MCP Tools:**
1. **search_notes** - AI searches user's knowledge base
2. **create_note** - AI creates notes from conversation
3. **update_note** - AI updates existing notes
4. **list_tags** - AI views available tags

**Transport:** stdio (local) or SSE (remote)

---

### 5. JWT Token Refresh Flow

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Database

    Frontend->>Frontend: Check token expiry (every 5 min)
    Frontend->>Frontend: Access token expires in <5 min
    Frontend->>Backend: POST /auth/refresh { refresh_token }
    Backend->>Database: SELECT session by token_hash
    alt Session valid
        Database-->>Backend: Session found
        Backend->>Backend: Generate new access token
        Backend-->>Frontend: { access_token, refresh_token }
        Frontend->>Frontend: Update stored tokens
    else Session invalid/expired
        Database-->>Backend: Session not found
        Backend-->>Frontend: 401 Unauthorized
        Frontend->>Frontend: Clear tokens, redirect to login
    end
```

**Steps:**
1. Frontend checks token expiry every 5 minutes (background job)
2. If access token expires in <5 minutes, trigger refresh
3. Backend validates refresh token hash against sessions table
4. If valid, issue new access token (optionally rotate refresh token)
5. Frontend updates localStorage with new tokens
6. If invalid, logout user and redirect to login

---

### 6. Manual Re-indexing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant EmbeddingService
    participant Database

    User->>Frontend: Click "Re-index" button on failed note
    Frontend->>Backend: POST /notes/:id/reindex
    Backend->>Database: UPDATE embedding_status = 'pending'
    Backend->>Backend: Queue embedding job
    Backend-->>Frontend: { status: 'pending' }
    Frontend->>User: Show "Indexing..." badge
    
    par Async Embedding
        Backend->>EmbeddingService: processNote(note_id)
        EmbeddingService->>EmbeddingService: Generate embedding
        alt Success
            EmbeddingService->>Database: UPDATE (status=completed)
        else Failure after 3 retries
            EmbeddingService->>Database: UPDATE (status=failed)
        end
    end
```

**Trigger:** User clicks "Re-index" button on notes with `embedding_status = 'failed'`

---


## Database Schema

Complete PostgreSQL schema with all tables, indexes, and constraints. This schema implements the data models defined earlier with optimizations for performance and data integrity.

### Prerequisites

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

### Tables

#### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX users_email_idx ON users(email);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

#### notes

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(384), -- 384-dimensional embeddings
  embedding_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
  tags TEXT[] NOT NULL DEFAULT '{}', -- Denormalized tags array
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX notes_user_id_created_at_idx ON notes(user_id, created_at DESC);
CREATE INDEX notes_user_id_updated_at_idx ON notes(user_id, updated_at DESC);
CREATE INDEX notes_embedding_status_idx ON notes(embedding_status) 
  WHERE embedding_status != 'completed';
CREATE INDEX notes_tags_gin_idx ON notes USING GIN(tags);
CREATE INDEX notes_is_archived_idx ON notes(user_id, is_archived) 
  WHERE is_archived = false;

-- HNSW index for fast vector similarity search
CREATE INDEX notes_embedding_hnsw_idx ON notes 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Triggers
CREATE TRIGGER notes_updated_at_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to reset embedding status when content changes
CREATE OR REPLACE FUNCTION reset_embedding_on_content_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.embedding_status = 'pending';
    NEW.embedding = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_content_change_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION reset_embedding_on_content_change();
```

**HNSW Parameters:**
- `m = 16` - Number of bi-directional links per node (trade-off: recall vs speed)
- `ef_construction = 64` - Size of dynamic candidate list (higher = better recall, slower build)
- These values optimized for ~10K notes per user

---

#### tags

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7), -- Hex color code (#RRGGBB)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name) -- Unique tag names per user
);

-- Indexes
CREATE INDEX tags_user_id_idx ON tags(user_id);
CREATE INDEX tags_name_idx ON tags(name);

-- Constraint for hex color validation
ALTER TABLE tags ADD CONSTRAINT tags_color_check 
  CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');
```

---

#### sessions

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX sessions_token_hash_idx ON sessions(token_hash);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

-- Auto-cleanup expired sessions (optional, can be cron job)
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run cleanup on every insert (lightweight, runs async)
CREATE TRIGGER sessions_cleanup_trigger
  AFTER INSERT ON sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION delete_expired_sessions();
```

---

### Database Size Estimation

**Assumptions:**
- 1,000 users
- Average 500 notes per user (500K total notes)
- Average note size: 2KB content + 384-dim vector (1.5KB)

**Calculations:**

| Table | Row Size | Row Count | Total Size | With Indexes | Total |
|-------|----------|-----------|------------|--------------|-------|
| users | 500 bytes | 1,000 | 0.5 MB | +0.5 MB | 1 MB |
| notes | 3.5 KB | 500,000 | 1.75 GB | +2.3 GB (HNSW 30%, GIN 20%) | 4 GB |
| tags | 200 bytes | 10,000 | 2 MB | +2 MB | 4 MB |
| sessions | 300 bytes | 5,000 | 1.5 MB | +1.5 MB | 3 MB |
| **Total** | | | **1.75 GB** | **2.3 GB** | **~4 GB** |

**Scaling:**
- 10K users, 5M notes → ~40 GB
- 100K users, 50M notes → ~400 GB
- PostgreSQL can handle 1TB+ with proper tuning

---

### Drizzle ORM Schema Files

For reference, here's how the schema maps to Drizzle ORM:

```typescript
// backend/src/db/schema/index.ts
export * from './users';
export * from './notes';
export * from './tags';
export * from './sessions';

// backend/src/db/schema/users.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  avatar_url: text('avatar_url'),
  terms_accepted_at: timestamp('terms_accepted_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// backend/src/db/schema/notes.ts
import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  embedding: customType<number[]>({
    dataType() { return 'vector(384)'; },
  })('embedding'),
  embedding_status: varchar('embedding_status', { length: 20 }).notNull().default('pending'),
  tags: text('tags').array().notNull().default([]),
  is_archived: boolean('is_archived').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  user_id_created_at_idx: index('notes_user_id_created_at_idx').on(table.user_id, table.created_at),
  user_id_updated_at_idx: index('notes_user_id_updated_at_idx').on(table.user_id, table.updated_at),
  tags_gin_idx: index('notes_tags_gin_idx').on(table.tags),
}));

// backend/src/db/schema/tags.ts
import { pgTable, uuid, varchar, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  user_id_idx: index('tags_user_id_idx').on(table.user_id),
  name_idx: index('tags_name_idx').on(table.name),
  user_id_name_unique: unique('tags_user_id_name_unique').on(table.user_id, table.name),
}));

// backend/src/db/schema/sessions.ts
import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token_hash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  user_id_idx: index('sessions_user_id_idx').on(table.user_id),
  expires_at_idx: index('sessions_expires_at_idx').on(table.expires_at),
}));
```

---

### Migration Strategy

**Initial Setup (v0.1.0):**
```bash
# Using Drizzle Kit
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg

# Or raw SQL
psql -U postgres -d personal_vault < schema.sql
```

**Future Migrations:**
- Use Drizzle Kit for schema changes
- Version migrations in `backend/migrations/` folder
- Apply migrations in CI/CD pipeline before deployment

---


## Frontend Architecture

This section describes the Next.js application structure, routing strategy, state management, and integration with the backend API.

### Technology Stack

- **Framework:** Next.js 16 with App Router
- **Runtime:** React 19 Server Components
- **Language:** TypeScript 5.7
- **Styling:** Tailwind CSS 3.4
- **UI Library:** shadcn/ui (Radix UI primitives)
- **State Management:** React hooks + SWR for server state
- **Forms:** react-hook-form + zod validation
- **Markdown:** react-markdown + remark-gfm + rehype-sanitize

---

### Directory Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── register/
│   │   │   └── page.tsx          # Registration page
│   │   └── layout.tsx            # Auth layout (centered card)
│   ├── (dashboard)/              # Dashboard route group (requires auth)
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard page
│   │   ├── notes/
│   │   │   ├── page.tsx          # Notes list page
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Note editor page
│   │   │   └── new/
│   │   │       └── page.tsx      # Create note page
│   │   ├── search/
│   │   │   └── page.tsx          # Search results page
│   │   └── layout.tsx            # Dashboard layout (sidebar + header)
│   ├── api/                      # API routes (BFF pattern if needed)
│   │   └── health/
│   │       └── route.ts          # Health check endpoint
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global Tailwind styles
│   └── not-found.tsx             # 404 page
├── components/                   # React components
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── auth-guard.tsx        # HOC for protected routes
│   ├── dashboard/
│   │   ├── dashboard-stats.tsx
│   │   ├── recent-notes.tsx
│   │   ├── mcp-status.tsx
│   │   └── sidebar.tsx
│   ├── notes/
│   │   ├── notes-list.tsx
│   │   ├── note-card.tsx
│   │   ├── note-editor.tsx
│   │   ├── markdown-preview.tsx
│   │   └── tag-selector.tsx
│   ├── search/
│   │   ├── search-bar.tsx
│   │   └── search-results.tsx
│   ├── providers/
│   │   ├── auth-provider.tsx
│   │   ├── theme-provider.tsx    # Dark mode provider
│   │   └── toast-provider.tsx
│   └── ui/                       # shadcn/ui components (40+ files)
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── ... (see components.json)
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Authentication hook
│   ├── use-notes.ts              # Notes data fetching
│   ├── use-search.ts             # Semantic search
│   ├── use-tags.ts               # Tags management
│   └── use-debounce.ts           # Utility hook
├── lib/                          # Utility libraries
│   ├── api-client.ts             # Axios instance with auth interceptor
│   ├── auth.ts                   # Token management utilities
│   ├── utils.ts                  # cn() helper, date formatting, etc.
│   └── constants.ts              # API base URL, config values
├── types/                        # Frontend-specific types
│   └── index.ts                  # Re-export shared schemas
├── public/                       # Static assets
│   ├── favicon.ico
│   └── images/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json               # shadcn/ui config
└── next.config.mjs
```

---

### Routing Strategy

**Route Groups:** Use Next.js 15+ route groups for layout separation

1. **(auth)** - Public routes with centered card layout
   - `/login` - Login page
   - `/register` - Registration page

2. **(dashboard)** - Protected routes with sidebar + header layout
   - `/dashboard` - Overview with stats and recent notes
   - `/notes` - Notes list with filters
   - `/notes/new` - Create new note
   - `/notes/[id]` - Edit note (split view editor)
   - `/search` - Semantic search results

**Route Protection:**
- Middleware checks authentication on all `(dashboard)` routes
- Unauthenticated users redirected to `/login`
- Authenticated users on `/login` redirected to `/dashboard`

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/notes') ||
                          request.nextUrl.pathname.startsWith('/search');

  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

### State Management

**Philosophy:** Minimal client state, leverage React Server Components for data fetching where possible.

#### Authentication State

**Storage:** localStorage for tokens, React Context for user state

```typescript
// components/providers/auth-provider.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContext {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from token on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      // Decode JWT to get user info (or fetch from API)
      const decoded = decodeJWT(token);
      setUser(decoded.user);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { user, access_token, refresh_token } = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setUser(user);
  };

  const logout = async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    await apiClient.post('/auth/logout', { refresh_token });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

#### Server State (Notes, Tags)

**Strategy:** Use SWR for data fetching with optimistic updates

```typescript
// hooks/use-notes.ts
import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { Note } from '@/types';

export function useNotes(filters?: NotesFilters) {
  const { data, error, mutate } = useSWR<{ notes: Note[]; pagination: Pagination }>(
    ['/notes', filters],
    ([url, filters]) => apiClient.get(url, { params: filters })
  );

  const createNote = async (note: CreateNoteInput) => {
    // Optimistic update
    const tempNote = { ...note, id: 'temp', embedding_status: 'pending', created_at: new Date() };
    mutate({ ...data, notes: [tempNote, ...data.notes] }, false);

    try {
      const created = await apiClient.post('/notes', note);
      mutate(); // Revalidate
      return created;
    } catch (error) {
      mutate(); // Rollback on error
      throw error;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    // Optimistic update
    mutate(
      { ...data, notes: data.notes.map(n => n.id === id ? { ...n, ...updates } : n) },
      false
    );

    try {
      const updated = await apiClient.patch(`/notes/${id}`, updates);
      mutate();
      return updated;
    } catch (error) {
      mutate();
      throw error;
    }
  };

  const deleteNote = async (id: string) => {
    // Optimistic update
    mutate({ ...data, notes: data.notes.filter(n => n.id !== id) }, false);

    try {
      await apiClient.delete(`/notes/${id}`);
      mutate();
    } catch (error) {
      mutate();
      throw error;
    }
  };

  return {
    notes: data?.notes || [],
    pagination: data?.pagination,
    isLoading: !data && !error,
    error,
    createNote,
    updateNote,
    deleteNote,
    refresh: mutate,
  };
}
```

---

### API Integration

**Client:** Axios with interceptors for auth and error handling

```typescript
// lib/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token refresh
apiClient.interceptors.response.use(
  (response) => response.data.data, // Extract data field
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem('refresh_token');
        const { access_token } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refresh_token }
        );
        localStorage.setItem('access_token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

### Performance Optimizations

1. **React Server Components** - Fetch data on server, reduce client JavaScript
2. **Code Splitting** - Dynamic imports for heavy components (markdown editor)
3. **Image Optimization** - Next.js `<Image>` component for avatars
4. **Font Optimization** - Geist font with `subsets: ['latin']`
5. **Debounced Search** - 300ms debounce on search input
6. **Pagination** - Load 50 notes per page, virtual scrolling for large lists
7. **SWR Cache** - In-memory cache for API responses, revalidate on focus
8. **Optimistic Updates** - Instant UI feedback on mutations

---

### Accessibility

- **WCAG 2.1 AA compliance** via Radix UI primitives
- **Keyboard navigation** - Full keyboard support for all interactions
- **Screen reader support** - ARIA labels on all interactive elements
- **Focus management** - Visible focus indicators, logical tab order
- **Color contrast** - 4.5:1 minimum contrast ratio
- **Dark mode** - Respects system preference, manual toggle

---


## Backend Architecture

This section describes the Elysia.js backend structure, service layer architecture, dependency injection, and MCP protocol implementation.

### Technology Stack

- **Runtime:** Bun 1.x
- **Framework:** Elysia.js (latest)
- **Language:** TypeScript 5.7
- **Database ORM:** Drizzle ORM
- **Database Driver:** postgres (node-postgres compatible with Bun)
- **Validation:** Zod (shared with frontend)
- **Authentication:** JWT (jsonwebtoken), bcrypt
- **ML Inference:** @xenova/transformers (Transformers.js)
- **MCP:** @modelcontextprotocol/sdk

---

### Directory Structure

```
backend/
├── src/
│   ├── index.ts                  # Application entry point
│   ├── app.ts                    # Elysia app initialization
│   ├── config/
│   │   ├── env.ts                # Environment variable validation
│   │   ├── database.ts           # Drizzle DB connection
│   │   └── embedding.ts          # Transformers.js config
│   ├── routes/
│   │   ├── auth.routes.ts        # /auth/* endpoints
│   │   ├── notes.routes.ts       # /notes/* endpoints
│   │   ├── tags.routes.ts        # /tags/* endpoints
│   │   ├── search.routes.ts      # /search endpoint
│   │   ├── mcp.routes.ts         # /mcp/* endpoints
│   │   └── health.routes.ts      # /health, /stats endpoints
│   ├── services/
│   │   ├── auth.service.ts       # Authentication logic
│   │   ├── notes.service.ts      # Notes business logic
│   │   ├── embedding.service.ts  # ML inference
│   │   ├── search.service.ts     # Semantic search
│   │   ├── tags.service.ts       # Tags management
│   │   └── mcp.service.ts        # MCP protocol handler
│   ├── repositories/
│   │   ├── user.repository.ts    # User data access
│   │   ├── notes.repository.ts   # Notes data access
│   │   ├── tags.repository.ts    # Tags data access
│   │   └── session.repository.ts # Session data access
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT validation
│   │   ├── error.middleware.ts   # Global error handler
│   │   ├── cors.middleware.ts    # CORS configuration
│   │   └── logger.middleware.ts  # Request logging
│   ├── db/
│   │   ├── schema/
│   │   │   ├── index.ts          # Export all schemas
│   │   │   ├── users.ts          # Drizzle user schema
│   │   │   ├── notes.ts          # Drizzle notes schema
│   │   │   ├── tags.ts           # Drizzle tags schema
│   │   │   └── sessions.ts       # Drizzle sessions schema
│   │   ├── migrations/           # Drizzle migration files
│   │   └── client.ts             # Database connection singleton
│   ├── queues/
│   │   └── embedding.queue.ts    # Background job queue for embeddings
│   ├── utils/
│   │   ├── jwt.ts                # JWT utilities
│   │   ├── password.ts           # Password hashing
│   │   └── response.ts           # Standard response helpers
│   └── types/
│       └── index.ts              # Backend-specific types
├── .cache/
│   └── transformers/             # Cached ML models
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── repositories/
│   └── integration/
│       └── routes/
├── package.json
├── tsconfig.json
├── drizzle.config.ts             # Drizzle Kit config
└── bun.lockb
```

---

### Application Entry Point

```typescript
// src/index.ts
import { app } from './app';
import { env } from './config/env';
import { db } from './db/client';
import { embeddingService } from './services/embedding.service';

// Initialize services before starting server
async function bootstrap() {
  console.log('🚀 Starting Personal Vault Backend...');

  // 1. Verify database connection
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // 2. Initialize embedding model (pre-load to avoid cold start)
  try {
    await embeddingService.initialize();
    console.log('✅ Embedding model loaded');
  } catch (error) {
    console.error('❌ Embedding model failed to load:', error);
    process.exit(1);
  }

  // 3. Start HTTP server
  app.listen(env.PORT, () => {
    console.log(`✅ Server running on http://localhost:${env.PORT}`);
  });
}

bootstrap();
```

---

### Elysia App Configuration

```typescript
// src/app.ts
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';

import { authRoutes } from './routes/auth.routes';
import { notesRoutes } from './routes/notes.routes';
import { tagsRoutes } from './routes/tags.routes';
import { searchRoutes } from './routes/search.routes';
import { mcpRoutes } from './routes/mcp.routes';
import { healthRoutes } from './routes/health.routes';

import { errorMiddleware } from './middleware/error.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import { env } from './config/env';

export const app = new Elysia()
  .use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'Personal Vault API',
        version: '1.0.0',
        description: 'REST API for Personal Vault knowledge management system',
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'notes', description: 'Notes CRUD operations' },
        { name: 'tags', description: 'Tags management' },
        { name: 'search', description: 'Semantic search' },
        { name: 'mcp', description: 'MCP protocol' },
        { name: 'health', description: 'Health checks' },
      ],
    },
  }))
  .use(loggerMiddleware)
  .use(errorMiddleware)
  .group('/api/v1', (app) =>
    app
      .use(authRoutes)
      .use(notesRoutes)
      .use(tagsRoutes)
      .use(searchRoutes)
      .use(mcpRoutes)
      .use(healthRoutes)
  );
```

---

### Authentication Middleware

```typescript
// src/middleware/auth.middleware.ts
import { Elysia } from 'elysia';
import { verifyJWT } from '@/utils/jwt';

export const authMiddleware = new Elysia()
  .derive(async ({ request, set }) => {
    const authorization = request.headers.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      set.status = 401;
      throw new Error('Unauthorized: Missing or invalid token');
    }

    const token = authorization.slice(7);

    try {
      const payload = await verifyJWT(token);
      return { user: payload }; // Attach user to context
    } catch (error) {
      set.status = 401;
      throw new Error('Unauthorized: Invalid or expired token');
    }
  });
```

---

### Route Example: Notes

```typescript
// src/routes/notes.routes.ts
import { Elysia, t } from 'elysia';
import { authMiddleware } from '@/middleware/auth.middleware';
import { notesService } from '@/services/notes.service';
import { NoteSchema, CreateNoteSchema } from '@/schemas/note';

export const notesRoutes = new Elysia({ prefix: '/notes' })
  .use(authMiddleware)
  .get(
    '/',
    async ({ user, query }) => {
      const notes = await notesService.list(user.id, query);
      return { success: true, data: notes };
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        tags: t.Optional(t.Array(t.String())),
        archived: t.Optional(t.Boolean()),
        sort: t.Optional(t.String()),
        order: t.Optional(t.String()),
      }),
      detail: { tags: ['notes'] },
    }
  )
  .post(
    '/',
    async ({ user, body }) => {
      const note = await notesService.create(user.id, body);
      return { success: true, data: note };
    },
    {
      body: CreateNoteSchema,
      response: {
        201: t.Object({
          success: t.Boolean(),
          data: NoteSchema,
        }),
      },
      detail: { tags: ['notes'] },
    }
  )
  .patch(
    '/:id',
    async ({ user, params, body }) => {
      const note = await notesService.update(params.id, user.id, body);
      return { success: true, data: note };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Partial(CreateNoteSchema),
      detail: { tags: ['notes'] },
    }
  )
  .delete(
    '/:id',
    async ({ user, params }) => {
      await notesService.delete(params.id, user.id);
      return { success: true, data: null };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['notes'] },
    }
  );
```

---

### Service Layer: Embedding Service

```typescript
// src/services/embedding.service.ts
import { pipeline, env as transformersEnv } from '@xenova/transformers';
import { notesRepository } from '@/repositories/notes.repository';

// Configure Transformers.js cache directory
transformersEnv.cacheDir = './.cache/transformers';

class EmbeddingService {
  private model: any;
  private isInitialized = false;
  private readonly MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  private readonly DIMENSIONS = 384;
  private processingQueue: Set<string> = new Set();

  async initialize() {
    if (this.isInitialized) return;

    console.log(`📥 Loading embedding model: ${this.MODEL_NAME}...`);
    this.model = await pipeline('feature-extraction', this.MODEL_NAME);
    this.isInitialized = true;
    console.log(`✅ Model loaded (${this.DIMENSIONS} dimensions)`);
  }

  async generateEmbedding(text: string): Promise<Float32Array> {
    if (!this.isInitialized) {
      throw new Error('Embedding service not initialized');
    }

    const output = await this.model(text, {
      pooling: 'mean',
      normalize: true,
    });

    return output.data; // Float32Array of 384 dimensions
  }

  async processNote(noteId: string, retryCount = 0): Promise<void> {
    // Prevent duplicate processing
    if (this.processingQueue.has(noteId)) {
      return;
    }

    this.processingQueue.add(noteId);

    try {
      // Set status to processing
      await notesRepository.updateEmbeddingStatus(noteId, 'processing');

      // Get note content
      const note = await notesRepository.findById(noteId);
      if (!note) {
        throw new Error(`Note ${noteId} not found`);
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(note.content);

      // Store in database
      await notesRepository.updateEmbedding(noteId, Array.from(embedding), 'completed');

      console.log(`✅ Embedding generated for note ${noteId}`);
    } catch (error) {
      console.error(`❌ Embedding failed for note ${noteId}:`, error);

      if (retryCount < 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.processNote(noteId, retryCount + 1);
      } else {
        // Final failure after 3 retries
        await notesRepository.updateEmbeddingStatus(noteId, 'failed');
        console.error(`❌ Embedding permanently failed for note ${noteId} after 3 retries`);
      }
    } finally {
      this.processingQueue.delete(noteId);
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      model: this.MODEL_NAME,
      dimensions: this.DIMENSIONS,
      queueSize: this.processingQueue.size,
    };
  }
}

export const embeddingService = new EmbeddingService();
```

---

### Background Job Queue

```typescript
// src/queues/embedding.queue.ts
import { embeddingService } from '@/services/embedding.service';

class EmbeddingQueue {
  private queue: string[] = [];
  private isProcessing = false;
  private readonly MAX_CONCURRENT = 5;
  private processing: Set<string> = new Set();

  async enqueue(noteId: string) {
    this.queue.push(noteId);
    this.process(); // Non-blocking
  }

  private async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 || this.processing.size > 0) {
      // Process up to MAX_CONCURRENT notes concurrently
      while (this.processing.size < this.MAX_CONCURRENT && this.queue.length > 0) {
        const noteId = this.queue.shift()!;
        this.processing.add(noteId);

        // Process in background (don't await)
        embeddingService
          .processNote(noteId)
          .finally(() => this.processing.delete(noteId));
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing.size,
    };
  }
}

export const embeddingQueue = new EmbeddingQueue();
```

---

### MCP Protocol Implementation

```typescript
// src/services/mcp.service.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { notesService } from './notes.service';
import { searchService } from './search.service';
import { tagsService } from './tags.service';

class MCPService {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'personal-vault',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.registerTools();
    this.registerResources();
  }

  private registerTools() {
    // Tool: search_notes
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'search_notes',
          description: 'Search notes using semantic similarity',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              limit: { type: 'number', description: 'Max results', default: 10 },
            },
            required: ['query'],
          },
        },
        {
          name: 'create_note',
          description: 'Create a new note',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['title', 'content'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'search_notes':
          const results = await searchService.semanticSearch(
            args.user_id,
            args.query,
            args.limit || 10
          );
          return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };

        case 'create_note':
          const note = await notesService.create(args.user_id, {
            title: args.title,
            content: args.content,
            tags: args.tags || [],
          });
          return { content: [{ type: 'text', text: `Note created: ${note.id}` }] };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private registerResources() {
    this.server.setRequestHandler('resources/list', async (request) => {
      const notes = await notesService.list(request.params.user_id, {});
      return {
        resources: notes.notes.map((note) => ({
          uri: `note://${note.id}`,
          name: note.title,
          description: note.content.slice(0, 100),
        })),
      };
    });

    this.server.setRequestHandler('resources/read', async (request) => {
      const noteId = request.params.uri.replace('note://', '');
      const note = await notesService.getById(noteId, request.params.user_id);
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: 'text/markdown',
            text: note.content,
          },
        ],
      };
    });
  }

  async startStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('✅ MCP server started (stdio transport)');
  }
}

export const mcpService = new MCPService();
```

---

### Error Handling

```typescript
// src/middleware/error.middleware.ts
import { Elysia } from 'elysia';

export const errorMiddleware = new Elysia()
  .onError(({ code, error, set }) => {
    console.error(`[ERROR] ${code}:`, error);

    switch (code) {
      case 'VALIDATION':
        set.status = 400;
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.message,
          },
        };

      case 'NOT_FOUND':
        set.status = 404;
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
          },
        };

      default:
        set.status = 500;
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          },
        };
    }
  });
```

---


## Unified Project Structure

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

### Workspace Configuration

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

## Development Workflow

### Local Development Setup

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

### Docker Compose (Development)

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

### Git Workflow

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

## Deployment Architecture

### Production Stack

```mermaid
graph TB
    subgraph "Client"
        A[Web Browser]
        B[AI Assistant<br/>Claude/ChatGPT]
    end

    subgraph "Edge CDN"
        C[Cloudflare/Vercel Edge]
    end

    subgraph "Application Servers"
        D1[Next.js Frontend<br/>Vercel/Docker]
        D2[Elysia Backend<br/>Docker Container]
    end

    subgraph "Database"
        E[(PostgreSQL 16<br/>pgvector)]
    end

    subgraph "Monitoring"
        F[Health Checks]
        G[Logs]
    end

    A --> C
    B --> D2
    C --> D1
    D1 --> D2
    D2 --> E
    D2 --> F
    D2 --> G
```

---

### Docker Production Build

```dockerfile
# backend/Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
COPY shared/package.json ./shared/
RUN bun install --frozen-lockfile --production

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.cache/transformers ./.cache/transformers

USER bunjs

EXPOSE 8000

CMD ["bun", "dist/index.js"]
```

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

---

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: personal_vault_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000/api/v1
    ports:
      - '3000:3000'
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: personal_vault_backend
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/personal_vault
      JWT_SECRET: ${JWT_SECRET}
      JWT_ACCESS_EXPIRY: 1h
      JWT_REFRESH_EXPIRY: 30d
      PORT: 8000
      NODE_ENV: production
      FRONTEND_URL: http://frontend:3000
    ports:
      - '8000:8000'
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: pgvector/pgvector:pg16
    container_name: personal_vault_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: personal_vault
    ports:
      - '5432:5432'
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: personal_vault_nginx
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_prod_data:
```

---

### Nginx Configuration

```nginx
# nginx.conf
events {
  worker_connections 1024;
}

http {
  upstream frontend {
    server frontend:3000;
  }

  upstream backend {
    server backend:8000;
  }

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

  server {
    listen 80;
    server_name example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API endpoints
    location /api/ {
      limit_req zone=api burst=20 nodelay;
      proxy_pass http://backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
      proxy_pass http://frontend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

---

### Deployment Checklist

**Pre-Deployment:**
- [ ] Run full test suite (`pnpm test`)
- [ ] Build production images (`docker-compose -f docker-compose.prod.yml build`)
- [ ] Database backup
- [ ] Update environment variables in `.env.prod`
- [ ] Generate SSL certificates (Let's Encrypt)

**Deployment:**
- [ ] Pull latest code (`git pull origin main`)
- [ ] Run database migrations (`pnpm db:migrate`)
- [ ] Start services (`docker-compose -f docker-compose.prod.yml up -d`)
- [ ] Verify health endpoints (`curl http://localhost:8000/health`)
- [ ] Check logs (`docker-compose logs -f`)

**Post-Deployment:**
- [ ] Smoke test critical flows (login, create note, search)
- [ ] Monitor error rates
- [ ] Verify embedding generation
- [ ] Test MCP integration

---

## Security and Performance

### Security Measures

**Authentication & Authorization:**
- JWT with short-lived access tokens (1h) and refresh tokens (30d)
- Bcrypt password hashing (cost factor: 12)
- Session revocation on logout
- Token validation on every protected route

**Input Validation:**
- Zod schema validation on both frontend and backend
- SQL injection prevention via parameterized queries (Drizzle ORM)
- XSS prevention via rehype-sanitize in markdown renderer
- CSRF protection (SameSite cookies)

**Data Protection:**
- HTTPS only in production (TLS 1.3)
- Secure HTTP headers (CSP, HSTS, X-Frame-Options)
- Password complexity requirements (min 8 chars, mixed case, numbers)
- No sensitive data in logs or error messages

**Database Security:**
- Row-level security (RLS) for multi-tenancy
- Regular backups (daily)
- Connection pooling with max connections limit
- Encrypted backups at rest

**Rate Limiting:**
- API rate limit: 10 requests/second per IP
- Burst allowance: 20 requests
- Auth endpoints: 5 requests/minute
- Search endpoint: 30 requests/minute

---

### Performance Optimizations

**Frontend:**
- React Server Components for initial rendering
- Code splitting with dynamic imports
- Image optimization (Next.js Image)
- Font subsetting (Geist Latin only)
- Debounced search (300ms)
- Optimistic UI updates
- SWR caching with revalidation on focus

**Backend:**
- Bun runtime (3x faster than Node.js)
- Connection pooling (max 20 connections)
- HNSW index for vector search (<50ms)
- GIN index for tag filtering (<10ms)
- Async embedding generation (non-blocking)
- Background job queue (max 5 concurrent)

**Database:**
- Composite indexes on frequently queried columns
- Partial indexes for filtered queries
- VACUUM ANALYZE schedule (weekly)
- Table partitioning for large datasets (future)

**Caching Strategy:**
- Frontend: SWR in-memory cache (5 min TTL)
- Backend: No caching layer initially (YAGNI)
- Future: Redis for session storage and rate limiting

**Performance Budgets:**
- Page load: <1 second (LCP)
- Search latency: <500ms
- Note save: <300ms
- Embedding generation: 300-500ms (acceptable for async)

---


## Testing Strategy

### Testing Pyramid

```
        /\
       /  \      E2E Tests (5%)
      /    \     - Critical user flows
     /------\    
    /        \   Integration Tests (25%)
   /          \  - API endpoint tests
  /------------\ - Database integration
 /              \
/________________\ Unit Tests (70%)
                   - Service layer
                   - Utility functions
                   - Components
```

---

### Frontend Testing

**Tools:**
- **Test Runner:** Vitest (fast, Vite-native)
- **Component Testing:** React Testing Library
- **E2E:** Playwright
- **Coverage:** c8 (built into Vitest)

**Unit Tests (`frontend/tests/unit/`):**

```typescript
// hooks/use-auth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '@/hooks/use-auth';

describe('useAuth', () => {
  it('should login and store tokens', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBeTruthy();
  });
});
```

**Component Tests (`frontend/tests/components/`):**

```typescript
// components/notes/note-card.test.tsx
import { render, screen } from '@testing-library/react';
import { NoteCard } from '@/components/notes/note-card';

describe('NoteCard', () => {
  const mockNote = {
    id: '123',
    title: 'Test Note',
    content: 'This is test content...',
    tags: ['typescript', 'testing'],
    created_at: new Date().toISOString(),
  };

  it('should render note title and excerpt', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText(/This is test content/)).toBeInTheDocument();
  });

  it('should render tags as badges', () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
  });
});
```

**E2E Tests (`frontend/tests/e2e/`):**

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register, login, and access dashboard', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="name"]', 'Test User');
    await page.check('[name="terms"]');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

---

### Backend Testing

**Tools:**
- **Test Runner:** Bun Test (built-in, fast)
- **Mocking:** Bun's built-in mock system
- **Coverage:** Bun's built-in coverage tool

**Unit Tests (`backend/tests/unit/`):**

```typescript
// services/auth.service.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { authService } from '@/services/auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    // Clean up test data
  });

  test('should hash password correctly', async () => {
    const password = 'password123';
    const hash = await authService.hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(hash).toStartWith('$2b$'); // bcrypt prefix
  });

  test('should validate correct password', async () => {
    const password = 'password123';
    const hash = await authService.hashPassword(password);
    const isValid = await authService.verifyPassword(password, hash);
    
    expect(isValid).toBe(true);
  });

  test('should reject incorrect password', async () => {
    const password = 'password123';
    const hash = await authService.hashPassword(password);
    const isValid = await authService.verifyPassword('wrongpassword', hash);
    
    expect(isValid).toBe(false);
  });
});
```

**Integration Tests (`backend/tests/integration/`):**

```typescript
// routes/notes.routes.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { app } from '@/app';

describe('Notes API', () => {
  let authToken: string;
  let noteId: string;

  beforeAll(async () => {
    // Register test user and get token
    const response = await app.handle(
      new Request('http://localhost/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
          terms_accepted: true,
        }),
      })
    );
    const data = await response.json();
    authToken = data.data.access_token;
  });

  test('POST /notes should create note', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Note',
          content: 'This is a test note',
          tags: ['test'],
        }),
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Note');
    noteId = data.data.id;
  });

  test('GET /notes/:id should return note', async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/v1/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.id).toBe(noteId);
  });
});
```

---

### Test Coverage Requirements

**Targets:**
- Overall: >80%
- Services: >90%
- Repositories: >90%
- Routes: >85%
- Components: >75%
- Utilities: >95%

**Coverage Reports:**
```bash
# Frontend
pnpm --filter frontend test:coverage

# Backend
pnpm --filter backend test:coverage
```

---

## Coding Standards

### TypeScript Configuration

**Strict Mode Enabled:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true
  }
}
```

---

### ESLint Rules

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

---

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `NoteCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useNotes.ts`)
- Services: `camelCase.service.ts` (e.g., `auth.service.ts`)
- Types: `PascalCase.ts` or `camelCase.types.ts`

**Variables:**
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- Functions: `camelCase` (e.g., `getUserById`)
- Classes: `PascalCase` (e.g., `NotesService`)
- Interfaces/Types: `PascalCase` (e.g., `User`, `CreateNoteInput`)

**React Components:**
- Props interface: `ComponentNameProps` (e.g., `NoteCardProps`)
- Event handlers: `handleEventName` (e.g., `handleSubmit`, `handleDelete`)
- State: descriptive names (e.g., `isLoading`, `notes`, `searchQuery`)

---

### Code Organization

**Imports Order:**
1. External dependencies (React, Next, etc.)
2. Internal absolute imports (`@/components`, `@/lib`)
3. Internal relative imports (`./utils`, `../types`)
4. Styles (if any)

```typescript
// Good
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useNotes } from '@/hooks/use-notes';
import { formatDate } from './utils';
```

---

### Documentation Standards

**JSDoc for Public APIs:**
```typescript
/**
 * Search notes using semantic similarity.
 * 
 * @param userId - The user ID to search notes for
 * @param query - Natural language search query
 * @param limit - Maximum number of results (default: 10)
 * @param threshold - Minimum similarity score 0.0-1.0 (default: 0.7)
 * @returns Array of notes with similarity scores
 * @throws {Error} If user not found or embedding service unavailable
 * 
 * @example
 * ```typescript
 * const results = await searchService.semanticSearch(
 *   'user-123',
 *   'python programming',
 *   10,
 *   0.7
 * );
 * ```
 */
async semanticSearch(
  userId: string,
  query: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  // Implementation...
}
```

---

## Error Handling Strategy

### Frontend Error Handling

**Hierarchy:**
1. **Component Level** - Try/catch in event handlers
2. **Hook Level** - Error state in custom hooks
3. **API Level** - Axios interceptor for global errors
4. **Application Level** - React Error Boundary

**Error Boundary:**
```typescript
// components/error-boundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
    // Send to error tracking service (future)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Backend Error Handling

**Error Types:**

```typescript
// types/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}
```

**Usage in Services:**

```typescript
// services/notes.service.ts
export class NotesService {
  async getById(noteId: string, userId: string): Promise<Note> {
    const note = await this.notesRepo.findById(noteId);

    if (!note) {
      throw new NotFoundError('Note');
    }

    if (note.user_id !== userId) {
      throw new UnauthorizedError('You do not have access to this note');
    }

    return note;
  }
}
```

---

### Logging Strategy

**Log Levels:**
- `ERROR` - Application errors, unhandled exceptions
- `WARN` - Recoverable issues, deprecated usage
- `INFO` - Important business events (user registered, note created)
- `DEBUG` - Detailed diagnostic information (development only)

**Structured Logging:**

```typescript
// utils/logger.ts
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Usage
logger.info('User registered', { userId: '123', email: 'user@example.com' });
logger.error('Embedding generation failed', { noteId: '456', error: error.message });
```

---

## Monitoring and Observability

### Health Checks

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "latency_ms": 5
  },
  "embedding_service": {
    "status": "ready",
    "model": "paraphrase-multilingual-MiniLM-L12-v2",
    "queue_size": 3
  }
}
```

---

### Metrics to Monitor

**Application Metrics:**
- Request rate (requests/second)
- Error rate (errors/second)
- Response time (p50, p95, p99)
- Active users (concurrent sessions)

**Business Metrics:**
- Notes created (per day)
- Searches performed (per day)
- Average search latency
- Embedding success rate
- MCP tool calls (per day)

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Database connections
- Queue depth

---

### Future: Observability Stack (v2.0+)

**Metrics:** Prometheus + Grafana
**Logs:** Loki or ELK Stack
**Tracing:** OpenTelemetry + Jaeger
**Error Tracking:** Sentry (opt-in only)

---

## Checklist Results

This section will be populated after running the architect checklist (`*execute-checklist architect-checklist`).

**Status:** ✅ Architecture document complete

**Sections Completed:**
- ✅ Introduction (Brownfield frontend analysis)
- ✅ High Level Architecture (System diagrams, patterns)
- ✅ Tech Stack (Definitive technology list)
- ✅ Data Models (4 models with Zod + Drizzle schemas)
- ✅ API Specification (15+ endpoints with request/response schemas)
- ✅ Components (Frontend + Backend component breakdown)
- ✅ External APIs (None - fully offline)
- ✅ Core Workflows (6 critical flows with sequence diagrams)
- ✅ Database Schema (Complete PostgreSQL DDL with indexes)
- ✅ Frontend Architecture (Next.js 16 structure, routing, state management)
- ✅ Backend Architecture (Elysia.js structure, services, MCP)
- ✅ Unified Project Structure (Monorepo with pnpm workspaces)
- ✅ Development Workflow (Setup, Docker Compose, Git workflow)
- ✅ Deployment Architecture (Production Docker setup, Nginx)
- ✅ Security and Performance (Auth, validation, optimizations)
- ✅ Testing Strategy (Unit, integration, E2E)
- ✅ Coding Standards (TypeScript, ESLint, naming conventions)
- ✅ Error Handling Strategy (Frontend + Backend error patterns)
- ✅ Monitoring and Observability (Health checks, metrics)

---

**Next Steps:**
1. Review this architecture document with stakeholders
2. Begin implementation with backend setup (Elysia.js + PostgreSQL)
3. Implement data models and database schema
4. Build core API endpoints (auth, notes CRUD)
5. Integrate embedding service (Transformers.js)
6. Connect frontend to backend API
7. Implement MCP protocol for AI integration
8. Deploy to staging environment
9. Conduct security audit
10. Launch MVP

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-02-16  
**Authored By:** Winston (Architect Agent) + User  
**Status:** Complete - Ready for Implementation

