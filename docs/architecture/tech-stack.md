# Tech Stack

This is the **DEFINITIVE** technology selection for the entire project. All development must use these exact versions to ensure consistency and compatibility across the fullstack application.

## Technology Stack Table

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
