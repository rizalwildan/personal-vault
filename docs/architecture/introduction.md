# Introduction

This document outlines the complete fullstack architecture for BMad-Personal-Vault, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

The BMad-Personal-Vault is a self-hosted knowledge management system that enables solo developers to maintain a "second brain" of technical notes, coding standards, and solutions. These notes can be instantly injected into AI conversations within IDEs (Cursor, VS Code, Claude Desktop) through the Model Context Protocol (MCP). The system follows a **reactive interaction model** where AI only accesses the knowledge base when explicitly invoked via `@knowledge-base` commands, ensuring privacy and control.

## Starter Template or Existing Project

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

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-16 | 1.0 | Initial architecture document draft | Winston (Architect) |

---
