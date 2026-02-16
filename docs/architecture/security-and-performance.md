# Security and Performance

## Security Measures

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

## Performance Optimizations

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

