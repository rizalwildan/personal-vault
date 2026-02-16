# Story X.X: [Story Title]

**Status:** Draft | In Progress | Done

---

## Story

**As a** [user type],
**I want** [goal],
**so that** [benefit].

---

## Acceptance Criteria

1. [Specific, measurable criterion]
2. [Specific, measurable criterion]
3. [Specific, measurable criterion]

---

## Tasks / Subtasks

- [ ] **Task 1: [Task Name]** (AC: 1, 2)
  - [ ] Subtask 1.1
  - [ ] Subtask 1.2

- [ ] **Task 2: [Task Name]** (AC: 3)
  - [ ] Subtask 2.1

---

## Dev Notes

### Previous Story Insights

**From Story X.Y:**
- [Key learnings or context from previous story]

### Architecture Context

This story implements [feature/component] that [purpose/goal].

### Technology Specifications

**[Technology Category]:**
- **[Technology Name]:** [Version] - [Purpose]
- **[Technology Name]:** [Version] - [Purpose]

[Source: [Architecture Section](../architecture/section.md)]

### Architecture Alignment Checklist

> **Usage Note:** Mark items as [x] completed, [ ] N/A with justification, or [⚠️] partially completed with explanation.
> See [Usage Guide](../../.bmad-core/checklists/architecture-alignment-usage-guide.md) for details.

#### 🏗️ 1. Architecture Decision Records (ADRs)

**Applicable ADRs:**
- [ ] ADR-XXX: [Technology/Pattern] - [How it applies to this story]

**New ADRs:**
- [ ] None required / [ ] Created ADR-XXX for [decision]

---

#### 🔄 2. Resilience Patterns (Section 24)

**Retry Policies:**
- [ ] Exponential backoff implemented for [operation]
- [ ] Max retries configured: [number]
- [ ] Retry attempts logged

**Circuit Breakers:**
- [ ] Circuit breaker for [external service]
- [ ] Failure thresholds: [rate] over [requests]
- [ ] State changes emit metrics

**Graceful Degradation:**
- [ ] Fallback strategy: [primary] → [fallback]
- [ ] UI feedback for degraded mode
- [ ] Manual alternative provided

**Timeouts:**
- [ ] Timeout configured: [duration] for [operation]

**Health Checks:**
- [ ] Health check added for [service]

**Mark N/A if:** No external services or async operations

---

#### 🔒 3. Security Standards (Sections 22 & 23)

**Authentication & Authorization:**
- [ ] Authentication check: [NextAuth / API Key]
- [ ] Authorization check: [user owns resource]

**Rate Limiting:**
- [ ] Rate limit: [rate] per [time] per [scope]
- [ ] 429 response with Retry-After header

**Input Validation:**
- [ ] All inputs validated with Zod schemas
- [ ] File paths validated (no path traversal)
- [ ] Input size limits enforced

**Data Protection:**
- [ ] Sensitive data hashed/encrypted
- [ ] API keys stored securely

**Mark N/A if:** Internal tooling or no user input

---

#### ♿ 4. Accessibility Standards (Section 21)

**Semantic HTML:**
- [ ] Proper HTML elements (<button>, <nav>, etc.)
- [ ] Heading hierarchy correct (h1→h2→h3)

**ARIA Attributes:**
- [ ] aria-label for icon buttons
- [ ] aria-describedby for form hints
- [ ] aria-live for dynamic content

**Keyboard Navigation:**
- [ ] Tab order logical
- [ ] Enter/Space triggers actions
- [ ] Escape closes modals
- [ ] Focus indicators visible

**Color & Contrast:**
- [ ] WCAG AA contrast ratios met (4.5:1 normal, 3:1 large)
- [ ] Color not sole indicator

**Testing:**
- [ ] Manual keyboard testing
- [ ] Screen reader testing (VoiceOver/NVDA)

**Mark N/A if:** Backend-only story

---

#### 📊 5. Monitoring & Observability (Section 19)

**Structured Logging:**
- [ ] Pino logger used
- [ ] Context included (user ID, request ID)
- [ ] Appropriate log levels

**Metrics:**
- [ ] Request latency tracked
- [ ] Error rate tracked
- [ ] Business metrics tracked: [metric]

**Error Tracking:**
- [ ] Errors logged with context
- [ ] Categorized (4xx vs 5xx)

**Mark N/A if:** Documentation or config only

---

#### ⚡ 6. Performance Standards (Section 15)

**Backend Performance:**
- [ ] Database queries optimized (indexes, pagination)
- [ ] API response time < [target]
- [ ] Background jobs asynchronous

**Frontend Performance:**
- [ ] Bundle size optimized (code splitting, lazy loading)
- [ ] Core Web Vitals targets met (LCP, FID, CLS)
- [ ] Images optimized (Next.js <Image>, WebP)

**Caching:**
- [ ] TanStack Query caching (5 min stale time)
- [ ] Redis caching for [data]

**Mark N/A if:** Performance not critical

---

#### 🧪 7. Testing Requirements (Section 16)

**Unit Tests:**
- [ ] Unit tests written for [components/logic]
- [ ] Coverage: 80%+ for critical paths

**Integration Tests:**
- [ ] API endpoints tested (happy path, errors, edge cases)

**E2E Tests:**
- [ ] Critical user flows tested

**Manual Testing:**
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Keyboard navigation tested
- [ ] Error scenarios tested

**Mark N/A if:** Config or docs only

---

#### 📝 8. Code Quality Standards (Section 17)

**Naming Conventions:**
- [ ] Components: PascalCase
- [ ] Hooks: camelCase with 'use'
- [ ] API routes: kebab-case
- [ ] Functions: camelCase
- [ ] Constants: SCREAMING_SNAKE_CASE

**Type Safety:**
- [ ] No `any` types used
- [ ] Shared types in packages/shared

**Code Organization:**
- [ ] Files in correct locations
- [ ] Imports organized (external→internal→relative)
- [ ] Path aliases used (@/components)

**Code Style:**
- [ ] ESLint passes
- [ ] Prettier formatted
- [ ] No console.log statements

---

#### 📚 9. Documentation Requirements

**Code Documentation:**
- [ ] README updated (if setup changed)
- [ ] JSDoc for public APIs
- [ ] API specification updated (if API changes)
- [ ] .env.example updated (if env vars added)

**Story Documentation:**
- [ ] Dev Agent Record completed (files, decisions, debt)
- [ ] Change Log updated

**Architecture Documentation:**
- [ ] Architecture doc updated (if new patterns)
- [ ] ADR created (if significant decision)

---

### Critical Implementation Notes

1. **[Important Note]:** [Details]
2. **[Important Note]:** [Details]

### Testing

**Manual Testing Approach:**

1. **[Test Type]:**
   - [Test step]
   - Expected: [result]

### Integration Points

**Dependencies:**
- **Story X.Y:** [What this story depends on]

**Blocks:**
- **Story X.Z:** [What this story blocks]

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| YYYY-MM-DD | 1.0 | Initial story creation | [Author] |

---

## Dev Agent Record

### Agent Model Used

[Model Name]

### Debug Log References

[Links to debug logs or "None"]

### Completion Notes

[Summary of implementation, validation results, key decisions]

**All acceptance criteria met:**
- ✅ AC1: [Brief evidence]
- ✅ AC2: [Brief evidence]
- ✅ AC3: [Brief evidence]

### Pre-QA Validation

- [ ] All applicable Architecture Alignment items completed or justified
- [ ] Lint passes: `npm run lint`
- [ ] Type-check passes: `npm run type-check`
- [ ] Tests pass: `npm run test` (or N/A)
- [ ] Manual testing completed
- [ ] Acceptance criteria met

**Ready for QA Review:** [Yes/No]

### File List

**Created:**
- `path/to/file.ts` - [Description]

**Modified:**
- `path/to/file.ts` - [What changed]

---

## QA Results

### Review Date: YYYY-MM-DD

### Reviewed By: [QA Reviewer Name]

### Code Quality Assessment

[Assessment summary]

### Refactoring Performed

[List of refactorings or "None"]

### Compliance Check

- [Standard]: ✓/✗ [Notes]
- [Standard]: ✓/✗ [Notes]

### Architecture Alignment Review

**Checklist Validation:**
- [ ] All applicable items marked or justified
- [ ] N/A justifications are reasonable
- [ ] No critical patterns missed

**Issues Found:**
- [Issue] - [Resolution]

### Improvements Checklist

- [x] [Improvement made]
- [ ] [Future improvement suggested]

### Security Review

[Security assessment or "No concerns"]

### Performance Considerations

[Performance assessment]

### Files Modified During Review

[List of files or "None"]

### Gate Status

Gate: PASS/FAIL → [Path to gate file]
Quality Score: [Score]/100

### Recommended Status

[✓ Ready for Done / ⚠️ Needs Minor Fixes / ✗ Requires Rework]

---

_Story created by: [Author]_
_Epic: [Epic Name]_
_Story Points: [Points]_
_Priority: [Priority]_
