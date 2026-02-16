<!-- Powered by BMAD™ Core -->

# Architecture Alignment Checklist

This checklist ensures that story implementations align with the **comprehensive architecture standards** (Sections 1-27). Use this checklist during story development and before QA review.

---

## How to Use This Checklist

1. **Copy to Story Dev Notes:** Add this checklist to the story's "Dev Notes" section
2. **Check Applicable Sections:** Not all sections apply to every story
3. **Mark N/A:** If a section doesn't apply, mark it as "N/A" with brief justification
4. **Validate Before QA:** Complete this checklist before requesting QA review
5. **Reference Architecture:** Use section links to review detailed requirements

---

## Checklist

### 🏗️ **1. Architecture Decision Records (ADRs)** - Section 26

**Applies to:** All stories involving technology choices or architectural patterns

- [ ] **Review relevant ADRs** for technologies used in this story
  - [ ] ADR-001: Docker Compose (if modifying docker-compose.yml)
  - [ ] ADR-002: Next.js App Router (if creating routes/pages)
  - [ ] ADR-003: FastMCP (if implementing MCP server features)
  - [ ] ADR-004: PostgreSQL/pgvector (if database changes)
  - [ ] ADR-005: Dual Authentication (if implementing auth features)
  - [ ] ADR-006: Monorepo (if adding packages/workspaces)
  - [ ] ADR-007: TanStack Query (if implementing frontend state)
  - [ ] ADR-008: Resilience Patterns (if calling external services)
  - [ ] ADR-009: OpenAI Embeddings (if implementing embeddings)
  - [ ] ADR-010: Redis (if implementing queues/rate limiting)
  - [ ] ADR-011: Prisma ORM (if database queries)
  - [ ] ADR-012: shadcn/ui (if adding UI components)

- [ ] **Document any new architectural decisions** (if introducing new tech/patterns)
  - [ ] Create ADR document if decision impacts future stories
  - [ ] Link ADR in story completion notes

**Mark N/A if:** Story is minor refactoring or documentation only

---

### 🔄 **2. Resilience Patterns** - Section 24

**Applies to:** Stories involving external services, APIs, background jobs, or file system operations

#### Retry Policies
- [ ] **Implement exponential backoff** for retriable operations
  - [ ] Database connection failures
  - [ ] External API calls (OpenAI, etc.)
  - [ ] File system operations (Epic 5)
  - [ ] MCP protocol requests (Epic 4)

- [ ] **Configure retry limits** (max retries: 3 for most operations)
- [ ] **Add jitter** to prevent thundering herd
- [ ] **Log retry attempts** with structured logging

#### Circuit Breakers
- [ ] **Implement circuit breaker** for external service calls
  - [ ] OpenAI API (Epic 3)
  - [ ] MCP protocol (Epic 4)
  - [ ] File system sync (Epic 5)

- [ ] **Define thresholds:**
  - [ ] Failure rate: 50% over 10 requests
  - [ ] Open duration: 30 seconds
  - [ ] Half-open test: 1 request

- [ ] **Emit metrics** on circuit breaker state changes

#### Graceful Degradation
- [ ] **Identify critical path vs optional features**
  - Critical: User auth, note CRUD, database access
  - Optional: Semantic search, tag suggestions, real-time features

- [ ] **Implement fallback strategies:**
  - [ ] Semantic search → Keyword search fallback
  - [ ] OpenAI embeddings → Local model fallback
  - [ ] Tag suggestions → Manual tag entry

- [ ] **UI feedback** for degraded mode
  - [ ] Show "Limited functionality" banner
  - [ ] Explain fallback behavior to user
  - [ ] Provide manual alternatives

#### Timeouts
- [ ] **Configure appropriate timeouts:**
  - [ ] Database queries: 5 seconds
  - [ ] OpenAI API: 30 seconds
  - [ ] MCP requests: 10 seconds
  - [ ] File operations: 15 seconds

- [ ] **Fail fast** on timeout (don't hang indefinitely)

#### Health Checks
- [ ] **Add health check** if introducing new service
- [ ] **Include dependency checks** (database, Redis, external APIs)
- [ ] **Return structured health status:**
  ```json
  {
    "status": "healthy" | "degraded" | "unhealthy",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "openai": "degraded"
    }
  }
  ```

**Mark N/A if:** Story is UI-only with no external dependencies or backend logic

---

### 🔒 **3. Security Standards** - Sections 22 & 23

**Applies to:** Stories involving authentication, API endpoints, data handling, or production deployment

#### Authentication & Authorization (Section 22)
- [ ] **Implement authentication** if creating protected endpoints
  - [ ] Use NextAuth.js session validation (Epic 2+)
  - [ ] Use API key authentication for MCP (Epic 4)
  - [ ] Verify user ownership of resources

- [ ] **Add authorization checks** before data access
  - [ ] User can only access their own notes
  - [ ] API keys scoped to specific users

#### Rate Limiting (Section 22)
- [ ] **Implement rate limiting** for public endpoints
  - [ ] MCP API: 100 requests/minute per API key
  - [ ] Search API: 30 requests/minute per user
  - [ ] Auth endpoints: 5 requests/minute (brute force protection)

- [ ] **Use Redis** for distributed rate limiting
- [ ] **Return 429 Too Many Requests** with Retry-After header

#### Input Validation (Section 23)
- [ ] **Validate all user inputs**
  - [ ] Sanitize Markdown content (XSS prevention)
  - [ ] Validate file paths (path traversal prevention)
  - [ ] Validate search queries (SQL injection prevention)
  - [ ] Limit input sizes (DoS prevention)

- [ ] **Use Zod schemas** for type-safe validation
- [ ] **Return structured validation errors**

#### Data Protection (Section 23)
- [ ] **Hash sensitive data** (passwords with bcrypt)
- [ ] **Store API keys securely** (encrypted at rest)
- [ ] **Use HTTPS** in production (Epic 6)
- [ ] **Add CORS headers** for MCP server (Epic 4)

#### Error Handling
- [ ] **Never expose stack traces** to users
- [ ] **Use error codes** from Section 18
- [ ] **Log security events** (failed auth, rate limit hits)

**Mark N/A if:** Story is internal tooling or local-only development workflow

---

### ♿ **4. Accessibility Standards (WCAG 2.1 AA)** - Section 21

**Applies to:** Stories implementing UI components, forms, or interactive elements

#### Semantic HTML
- [ ] **Use proper HTML elements**
  - [ ] `<button>` for clickable actions (not `<div>`)
  - [ ] `<nav>` for navigation
  - [ ] `<main>` for main content
  - [ ] `<form>` for forms
  - [ ] `<label>` for form inputs

- [ ] **Use heading hierarchy** (`<h1>` → `<h2>` → `<h3>`, no skipping)

#### ARIA Attributes
- [ ] **Add ARIA labels** to interactive elements
  - [ ] `aria-label` for icon buttons
  - [ ] `aria-describedby` for form hints
  - [ ] `aria-live` for dynamic content (search results, notifications)
  - [ ] `aria-expanded` for collapsible sections

- [ ] **Use ARIA roles** when semantic HTML isn't sufficient
  - [ ] `role="dialog"` for modals
  - [ ] `role="alert"` for error messages
  - [ ] `role="status"` for status updates

#### Keyboard Navigation
- [ ] **All interactive elements are keyboard accessible**
  - [ ] Tab order is logical
  - [ ] Enter/Space triggers buttons
  - [ ] Escape closes modals
  - [ ] Arrow keys navigate lists

- [ ] **Focus indicators visible** (no `outline: none` without replacement)
- [ ] **Skip to main content** link for screen readers

#### Color & Contrast
- [ ] **Color contrast meets WCAG AA:**
  - [ ] Normal text: 4.5:1 minimum
  - [ ] Large text (18pt+): 3:1 minimum
  - [ ] UI components: 3:1 minimum

- [ ] **Don't rely on color alone** (use icons + text)

#### Form Accessibility
- [ ] **All inputs have labels** (visible or `aria-label`)
- [ ] **Error messages linked** with `aria-describedby`
- [ ] **Required fields marked** with `aria-required="true"`
- [ ] **Validation errors announced** to screen readers

#### Testing
- [ ] **Manual keyboard testing** (no mouse, only keyboard)
- [ ] **Screen reader testing** (VoiceOver on macOS or NVDA on Windows)
- [ ] **Automated testing** with axe DevTools (if available)

**Mark N/A if:** Story is backend-only or API implementation

---

### 📊 **5. Monitoring & Observability** - Section 19

**Applies to:** All stories with backend logic, API endpoints, or background jobs

#### Structured Logging
- [ ] **Use Pino logger** for all logging
- [ ] **Include context** in logs:
  - [ ] User ID (if authenticated request)
  - [ ] Request ID (for tracing)
  - [ ] Operation name
  - [ ] Timing information

- [ ] **Log levels appropriate:**
  - [ ] `error`: Failures requiring attention
  - [ ] `warn`: Degraded functionality
  - [ ] `info`: Normal operations (sparingly)
  - [ ] `debug`: Detailed debugging info (development only)

#### Metrics
- [ ] **Emit metrics** for key operations:
  - [ ] Request latency (p50, p95, p99)
  - [ ] Error rate
  - [ ] Queue length (if using Redis)
  - [ ] Cache hit rate (if using caching)

- [ ] **Track business metrics:**
  - [ ] Notes created/updated/deleted
  - [ ] Search queries performed
  - [ ] Embeddings generated

#### Error Tracking
- [ ] **Log errors with full context**
  - [ ] Error message and stack trace
  - [ ] Request details (method, path, body)
  - [ ] User context (if applicable)

- [ ] **Categorize errors** (4xx client errors vs 5xx server errors)

#### Performance Monitoring
- [ ] **Track operation duration**
  - [ ] Database queries
  - [ ] External API calls
  - [ ] Background jobs

- [ ] **Alert on performance degradation:**
  - [ ] Search latency > 2 seconds
  - [ ] API response time > 500ms (p95)

**Mark N/A if:** Story is documentation or configuration only

---

### ⚡ **6. Performance Standards** - Section 15

**Applies to:** Stories with database queries, API calls, or frontend rendering

#### Backend Performance
- [ ] **Database queries optimized**
  - [ ] Use indexes for filtered columns
  - [ ] Limit result sets (pagination)
  - [ ] Use connection pooling (Prisma handles this)
  - [ ] Avoid N+1 queries (use `include` for relations)

- [ ] **API response time targets:**
  - [ ] < 500ms for CRUD operations (p95)
  - [ ] < 2s for semantic search (p95)
  - [ ] < 100ms for health checks

- [ ] **Background jobs asynchronous** (don't block requests)

#### Frontend Performance
- [ ] **Bundle size optimized**
  - [ ] Code splitting for routes
  - [ ] Dynamic imports for heavy components
  - [ ] Tree-shaking unused code

- [ ] **Core Web Vitals targets:**
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1

- [ ] **Images optimized**
  - [ ] Use Next.js `<Image>` component
  - [ ] WebP format with fallback
  - [ ] Lazy loading for below-fold images

#### Caching
- [ ] **Implement caching** where appropriate:
  - [ ] TanStack Query for API data (5 min stale time)
  - [ ] Redis for rate limiting counters
  - [ ] Browser cache for static assets

**Mark N/A if:** Performance is not critical for this story (e.g., admin tools)

---

### 🧪 **7. Testing Requirements** - Section 16

**Applies to:** All stories (different testing strategies for different story types)

#### Unit Tests (Epic 2+)
- [ ] **Write unit tests** for business logic
  - [ ] Utility functions
  - [ ] Data transformations
  - [ ] Validation logic
  - [ ] State management hooks

- [ ] **Use Vitest** for unit tests
- [ ] **Coverage target:** 80% for critical code paths

#### Integration Tests (Epic 2+)
- [ ] **Write integration tests** for API routes
  - [ ] Test happy path
  - [ ] Test error cases (invalid input, auth failures)
  - [ ] Test edge cases

- [ ] **Use Vitest + Supertest** for API testing
- [ ] **Coverage target:** All API endpoints tested

#### E2E Tests (Epic 2+)
- [ ] **Write E2E tests** for critical user flows
  - [ ] User registration/login
  - [ ] Create/edit/delete note
  - [ ] Search functionality

- [ ] **Use Playwright** for E2E tests
- [ ] **Coverage target:** All critical paths tested

#### Manual Testing
- [ ] **Manual testing completed**
  - [ ] Test in Chrome, Firefox, Safari
  - [ ] Test keyboard navigation
  - [ ] Test with screen reader (if UI)
  - [ ] Test error scenarios

**Mark N/A if:** Story is configuration or documentation only

---

### 📝 **8. Code Quality Standards** - Section 17

**Applies to:** All stories with code changes

#### Naming Conventions
- [ ] **Follow naming conventions:**
  - [ ] Components: PascalCase (`NoteCard.tsx`)
  - [ ] Hooks: camelCase with `use` prefix (`useNotes.ts`)
  - [ ] API routes: kebab-case (`create-note/route.ts`)
  - [ ] Functions: camelCase (`fetchNotes`)
  - [ ] Constants: SCREAMING_SNAKE_CASE (`API_BASE_URL`)
  - [ ] Database columns: snake_case (`user_id`, `created_at`)

#### Type Safety
- [ ] **TypeScript strict mode** enabled
- [ ] **No `any` types** (use `unknown` if necessary)
- [ ] **Proper error types** (don't use `any` in catch blocks)
- [ ] **Shared types** in `packages/shared` (if used across apps)

#### Code Organization
- [ ] **Files in correct locations:**
  - [ ] Components: `components/ui/` (shadcn) or `components/` (custom)
  - [ ] Hooks: `hooks/`
  - [ ] Utils: `lib/`
  - [ ] API routes: `app/api/`
  - [ ] Types: `types/` or co-located

- [ ] **Imports organized:**
  - [ ] External libraries first
  - [ ] Internal imports second
  - [ ] Relative imports last
  - [ ] Use path aliases (`@/components` not `../../components`)

#### Code Style
- [ ] **ESLint passes** with no errors
- [ ] **Prettier formatted** (run `npm run format`)
- [ ] **No console.log** (use logger or remove)
- [ ] **Comments for complex logic** (not obvious code)

**Mark N/A if:** Story is documentation only

---

### 📚 **9. Documentation Requirements**

**Applies to:** All stories

#### Code Documentation
- [ ] **Update README** if setup process changed
- [ ] **Add JSDoc comments** for public APIs
- [ ] **Update API specification** (Section 5) if API changes
- [ ] **Document environment variables** in `.env.example`

#### Story Documentation
- [ ] **Dev Agent Record completed:**
  - [ ] List all files created/modified
  - [ ] Document key implementation decisions
  - [ ] Note any technical debt
  - [ ] Link to debug log if needed

- [ ] **Change Log updated** in story file

#### Architecture Documentation
- [ ] **Update architecture doc** if introducing new patterns
- [ ] **Create ADR** if making significant architectural decision
- [ ] **Update diagrams** (Section 25) if system structure changed

**Mark N/A if:** No documentation updates needed

---

## ✅ **Validation Summary**

Before marking story as complete, ensure:

- [ ] All applicable checklist items above are completed or marked N/A
- [ ] Code passes linting and type-checking (`npm run lint`, `npm run type-check`)
- [ ] All tests pass (`npm run test` if tests exist)
- [ ] Manual testing completed for changed functionality
- [ ] Story acceptance criteria met
- [ ] QA reviewer can validate changes

---

## 📖 **Architecture Section Reference**

Quick links to architecture sections:

- [Section 15: Security and Performance](../docs/architecture/15-security-and-performance.md)
- [Section 16: Testing Strategy](../docs/architecture/16-testing-strategy.md)
- [Section 17: Coding Standards](../docs/architecture/17-coding-standards.md)
- [Section 18: Error Handling Strategy](../docs/architecture/18-error-handling-strategy.md)
- [Section 19: Monitoring and Observability](../docs/architecture/19-monitoring-and-observability.md)
- [Section 21: Accessibility Standards](../docs/architecture/21-accessibility-standards.md)
- [Section 22: MCP Security Strategy](../docs/architecture/22-mcp-security.md)
- [Section 23: Production Security Checklist](../docs/architecture/23-production-security-checklist.md)
- [Section 24: Resilience Patterns](../docs/architecture/24-resilience-patterns.md)
- [Section 26: Architecture Decision Records](../docs/architecture/26-architecture-decision-records.md)

---

**Last Updated:** 2026-02-16
**Version:** 1.0
**Maintained by:** Sarah (Product Owner)
