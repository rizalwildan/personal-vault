<!-- Powered by BMAD™ Core -->

# Architecture Alignment Checklist - Usage Guide

This guide explains **how to use the Architecture Alignment Checklist** during story development to ensure consistent quality and adherence to architecture standards.

---

## 🎯 **Purpose**

The Architecture Alignment Checklist ensures:

1. **Consistency:** All stories follow the same architecture standards
2. **Quality:** No critical patterns (security, accessibility, resilience) are overlooked
3. **Traceability:** Clear documentation of why decisions were made
4. **Efficiency:** Catch issues during development, not during QA

---

## 📋 **When to Use**

### **Required for:**
- ✅ All stories in Epic 2+ (stories with actual implementation)
- ✅ Any story that introduces new code (backend or frontend)
- ✅ Any story that modifies existing functionality

### **Optional for:**
- ⚠️ Documentation-only stories (can use abbreviated version)
- ⚠️ Configuration-only stories (only check relevant sections)

### **Not needed for:**
- ❌ Spike/research stories (exploratory work)
- ❌ Pure refactoring without functional changes (unless changing patterns)

---

## 🔄 **Workflow Integration**

### **Phase 1: Story Planning (Before Development)**

**When:** Product Owner creates story, Developer Agent reviews

**Steps:**
1. Copy checklist to story "Dev Notes" section
2. Review checklist sections that apply to this story
3. Mark sections as "Applicable" or "N/A"
4. Identify any unknowns or questions
5. Discuss with Product Owner if clarification needed

**Example:**
```markdown
## Dev Notes

### Architecture Alignment

**Applicable Sections:**
- ✅ Section 2: Resilience Patterns (calling OpenAI API)
- ✅ Section 3: Security (API endpoint)
- ✅ Section 7: Testing (new feature)
- N/A Section 4: Accessibility (backend only)

**Questions for PO:**
- Should we implement circuit breaker or just retry logic for OpenAI?
- What's the acceptable timeout for embedding generation?
```

---

### **Phase 2: During Development**

**When:** Developer Agent implements story

**Steps:**
1. **Reference checklist** as you implement each feature
2. **Check off items** as you complete them
3. **Document N/A items** with brief justification
4. **Note any deviations** from architecture (with rationale)

**Best Practices:**
- Don't wait until the end - check off items as you go
- If you can't complete an item, document why (tech debt)
- Link to architecture sections when implementing complex patterns
- Ask questions early if something is unclear

**Example:**
```markdown
### Architecture Alignment Checklist

#### Resilience Patterns
- [x] Implement exponential backoff for OpenAI API
  - Implemented in `lib/embeddings/retry-logic.ts`
  - Max 3 retries, base delay 1s, jitter added
- [x] Add timeout configuration (30s for OpenAI)
  - Set in `lib/embeddings/config.ts`
- [ ] Circuit breaker implementation
  - DEFERRED: Will add in Epic 3.2 after testing retry logic
  - Documented as technical debt in completion notes
```

---

### **Phase 3: Before QA Review**

**When:** Developer Agent completes implementation, before requesting QA

**Steps:**
1. **Review entire checklist** - ensure nothing missed
2. **Verify all applicable items** are checked or justified as N/A
3. **Run validation commands:**
   ```bash
   npm run lint        # Code style
   npm run type-check  # TypeScript
   npm run test        # Tests (if exist)
   npm run format      # Prettier
   ```
4. **Manual testing** for user-facing features
5. **Update story completion notes** with summary

**Completion Checklist:**
```markdown
### Pre-QA Validation

- [x] All applicable Architecture Alignment items completed
- [x] Lint passes: `npm run lint` ✅
- [x] Type-check passes: `npm run type-check` ✅
- [x] Tests pass: `npm run test` ✅ (or N/A if no tests)
- [x] Manual testing completed
- [x] Acceptance criteria met
- [x] Files list updated
- [x] Change log updated

**Ready for QA Review** ✅
```

---

### **Phase 4: QA Review**

**When:** QA Reviewer validates story

**Steps:**
1. **Review Architecture Alignment checklist** in story
2. **Verify N/A justifications** are reasonable
3. **Spot-check implementation** against checklist items
4. **Validate testing coverage**
5. **Check for any missing architecture alignment**

**QA Focus Areas:**
- Are resilience patterns implemented for external services?
- Are security standards followed for API endpoints?
- Are accessibility standards met for UI components?
- Is error handling consistent with Section 18?
- Are ADRs referenced for technology choices?

---

## 📝 **How to Fill Out the Checklist**

### **Option 1: Full Checklist (Recommended)**

Copy entire checklist to story Dev Notes section. Mark each item:

```markdown
- [x] Item completed
- [ ] Item not applicable - REASON
- [⚠️] Item partially completed - REASON
```

**Example:**
```markdown
### Architecture Alignment Checklist

#### 1. Architecture Decision Records (ADRs)
- [x] ADR-007: TanStack Query - using for server state
- [x] ADR-011: Prisma ORM - database queries implemented
- [ ] ADR-008: Resilience Patterns - N/A (no external services in this story)

#### 3. Security Standards
- [x] Authentication checks - using NextAuth session validation
- [x] Input validation - Zod schemas for all inputs
- [x] Rate limiting - N/A (internal API only)
```

---

### **Option 2: Summary Checklist (For Simple Stories)**

For straightforward stories, use abbreviated format:

```markdown
### Architecture Alignment Summary

**Applicable Sections:**
- ✅ ADRs: Reviewed ADR-011 (Prisma)
- ✅ Code Quality: Follows naming conventions, TypeScript strict
- ✅ Testing: Unit tests added
- N/A Resilience: No external services
- N/A Security: No auth changes
- N/A Accessibility: Backend only

**Validation:**
- [x] Lint/type-check passes
- [x] Tests pass
- [x] Manual testing complete
```

---

## 🚨 **Common Pitfalls to Avoid**

### **Pitfall #1: Skipping "Doesn't Apply" Items**

**Wrong:**
```markdown
- [ ] Implement circuit breaker
```
*(No explanation, QA reviewer doesn't know if forgotten or N/A)*

**Right:**
```markdown
- [ ] Implement circuit breaker - N/A (no external services in this story)
```

---

### **Pitfall #2: Deferring Too Many Items**

**Wrong:**
```markdown
- [ ] Input validation - DEFERRED (will add later)
- [ ] Error handling - DEFERRED (will add later)
- [ ] Testing - DEFERRED (will add later)
```
*(Too much technical debt, should be done now)*

**Right:**
```markdown
- [x] Input validation - Zod schemas implemented
- [x] Error handling - Using handleApiError() utility
- [x] Testing - Unit tests for core logic added
- [ ] E2E tests - DEFERRED to Epic 2.5 (testing infrastructure story)
```

---

### **Pitfall #3: Not Linking to Architecture**

**Wrong:**
```markdown
- [x] Retry logic implemented
```
*(No context on what was implemented)*

**Right:**
```markdown
- [x] Retry logic implemented per Section 24 (Resilience Patterns)
  - Max 3 retries with exponential backoff
  - Implemented in lib/retry.ts
```

---

### **Pitfall #4: Ignoring ADRs**

**Wrong:**
```markdown
- [x] Used Redux for state management
```
*(Conflicts with ADR-007 which specifies TanStack Query)*

**Right:**
```markdown
- [x] Used TanStack Query per ADR-007
- [ ] OR: Created ADR-013 for Redux decision (with justification)
```

---

## 🎓 **Examples by Story Type**

### **Example 1: Backend API Story (Epic 3 - Semantic Search)**

```markdown
### Architecture Alignment Checklist

#### ADRs
- [x] ADR-008: Resilience Patterns - retry for OpenAI
- [x] ADR-009: OpenAI Embeddings - using with local fallback
- [x] ADR-010: Redis - queue for background jobs

#### Resilience Patterns
- [x] Retry with exponential backoff (3 attempts)
- [x] Circuit breaker for OpenAI API
- [x] Graceful degradation to local embeddings
- [x] Timeout: 30s for OpenAI

#### Security
- [x] Authentication check (session validation)
- [x] Input validation (search query sanitization)
- [x] Rate limiting: 30 requests/min per user
- [x] Error messages don't expose internals

#### Monitoring
- [x] Structured logging with Pino
- [x] Metrics: search latency, error rate
- [x] Alert if p95 latency > 2s

#### Testing
- [x] Unit tests for search logic
- [x] Integration test for API endpoint
- [x] Manual testing with 1000 notes

**N/A Sections:**
- Accessibility (backend only)
- Frontend Performance (no UI changes)
```

---

### **Example 2: Frontend UI Story (Epic 2 - Dashboard)**

```markdown
### Architecture Alignment Checklist

#### ADRs
- [x] ADR-002: Next.js App Router - using route groups
- [x] ADR-007: TanStack Query - for note list state
- [x] ADR-012: shadcn/ui - Button, Card components

#### Accessibility
- [x] Semantic HTML: <button>, <nav>, <main>
- [x] ARIA labels for icon buttons
- [x] Keyboard navigation tested (Tab, Enter, Escape)
- [x] Focus indicators visible
- [x] Color contrast checked (WCAG AA)
- [x] Screen reader tested (VoiceOver)

#### Frontend Performance
- [x] Code splitting for dashboard route
- [x] Images optimized with Next.js <Image>
- [x] Bundle size < 300KB
- [x] LCP < 2.5s (tested with Lighthouse)

#### Testing
- [x] Unit tests for useNotes hook
- [x] E2E test for note creation flow
- [x] Manual testing: Chrome, Firefox, Safari

**N/A Sections:**
- Resilience Patterns (no external services)
- MCP Security (not MCP-related)
```

---

### **Example 3: Infrastructure Story (Epic 1 - Docker Setup)**

```markdown
### Architecture Alignment Summary

**Applicable:**
- ✅ ADR-001: Docker Compose - implemented
- ✅ ADR-004: PostgreSQL + pgvector - configured
- ✅ Code Quality: Dockerfile follows best practices
- ✅ Documentation: README updated with setup steps

**N/A:**
- Resilience Patterns (infrastructure only)
- Security Standards (dev environment)
- Accessibility (no UI)
- Testing (manual validation)

**Validation:**
- [x] `docker-compose up` starts all services
- [x] PostgreSQL accessible from host
- [x] pgvector extension loads
- [x] Health check passes
```

---

## 🔧 **Tools to Help**

### **VS Code Snippets**

Add to `.vscode/architecture-alignment.code-snippets`:

```json
{
  "Architecture Alignment Checklist": {
    "prefix": "arch-checklist",
    "body": [
      "### Architecture Alignment Checklist",
      "",
      "#### ADRs",
      "- [ ] Review relevant ADRs",
      "",
      "#### Resilience Patterns",
      "- [ ] Retry policies (if external services)",
      "- [ ] Circuit breaker (if needed)",
      "- [ ] Graceful degradation",
      "",
      "#### Security",
      "- [ ] Authentication/Authorization",
      "- [ ] Input validation",
      "- [ ] Rate limiting (if public endpoint)",
      "",
      "#### Accessibility",
      "- [ ] Semantic HTML",
      "- [ ] ARIA attributes",
      "- [ ] Keyboard navigation",
      "",
      "#### Testing",
      "- [ ] Unit tests",
      "- [ ] Integration tests",
      "- [ ] Manual testing",
      "",
      "**N/A Sections:** $1"
    ],
    "description": "Insert Architecture Alignment Checklist template"
  }
}
```

---

### **Pre-Commit Hook Reminder**

Add to `.husky/pre-commit`:

```bash
echo "🏗️  Architecture Alignment Checklist: Did you update it?"
echo "   Run 'npm run lint && npm run type-check' before committing"
```

---

## 📊 **Success Metrics**

Track checklist effectiveness:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Checklist Completion** | 100% | All stories have checklist in Dev Notes |
| **QA First-Pass Rate** | >90% | Stories pass QA without rework |
| **Architecture Violations** | <5% | QA identifies < 5% stories with violations |
| **Time to Complete Checklist** | <15 min | Self-reported by Dev Agent |

---

## 🆘 **Need Help?**

### **Checklist Too Long?**
- Use "Summary Checklist" format for simple stories
- Mark entire sections N/A if not applicable

### **Don't Know if Section Applies?**
- Ask Product Owner during story planning
- Default to INCLUDE if uncertain (better safe than sorry)

### **Found a Bug in Checklist?**
- Update `.bmad-core/checklists/architecture-alignment-checklist.md`
- Note version number in story (for traceability)

### **Checklist Conflicts with Story Requirements?**
- Discuss with Product Owner
- May need to update architecture or create new ADR

---

## 📚 **Additional Resources**

- [Architecture Document](../../docs/architecture/index.md) - Full architecture reference
- [ADRs](../../docs/architecture/26-architecture-decision-records.md) - Decision records
- [Coding Standards](../../docs/architecture/17-coding-standards.md) - Code quality rules
- [Testing Strategy](../../docs/architecture/16-testing-strategy.md) - Testing requirements

---

**Last Updated:** 2026-02-16
**Version:** 1.0
**Maintained by:** Sarah (Product Owner)
