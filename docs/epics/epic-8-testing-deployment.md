# Epic 8: Testing, Optimization & Production Deployment

**Status:** Not Started
**Priority:** HIGH
**Estimated Duration:** 5-7 days
**Dependencies:** Epic 1-7 (All previous epics)

---

## Epic Goal

Ensure system quality through comprehensive testing, optimize performance for production use, and deploy the complete BMad-Personal-Vault application to a VPS with proper security, monitoring, and documentation.

---

## Epic Description

### Context

With all features implemented (auth, notes CRUD, search, MCP), this epic focuses on:
1. **Quality Assurance** - Testing backend and frontend
2. **Performance Optimization** - Database indexes, query optimization, bundle size
3. **Production Deployment** - VPS setup, nginx, SSL, domain configuration
4. **Monitoring & Maintenance** - Health checks, logging, backup procedures
5. **Documentation** - User guide, deployment guide, troubleshooting

**Deployment Target:**
- VPS (DigitalOcean, Linode, Vultr, Hetzner)
- Docker Compose production setup
- Nginx reverse proxy with SSL/TLS
- Custom domain (optional)

---

### What This Epic Delivers

1. **Test Suite**
   - Backend unit tests (>80% coverage)
   - Backend integration tests (all endpoints)
   - Frontend component tests
   - E2E tests for critical flows

2. **Performance Optimization**
   - Database query optimization
   - Frontend bundle size reduction
   - Image optimization
   - Caching strategies

3. **Production Infrastructure**
   - VPS provisioning and setup
   - Docker Compose production config
   - Nginx reverse proxy with SSL
   - Environment variable management
   - Database backups

4. **Monitoring & Logging**
   - Health check endpoints
   - Error logging
   - Performance metrics
   - Uptime monitoring

5. **Documentation**
   - Deployment guide
   - User manual
   - API documentation (Swagger)
   - Troubleshooting guide

---

## Stories

### Story 1: Backend Testing (Unit + Integration)

**Goal:** Achieve >80% test coverage for backend code.

**Key Tasks:**
- Set up Bun test suite
- Write unit tests for utilities (auth, embedding, validation)
- Write integration tests for all API endpoints
- Test database operations
- Test error handling
- Add test database setup/teardown

**Acceptance Criteria:**
- [ ] Test framework configured (Bun test or Vitest)
- [ ] Unit tests cover: JWT utils, password hashing, embedding preprocessing
- [ ] Integration tests cover all 15+ API endpoints
- [ ] Test coverage >80% (measured by c8 or similar)
- [ ] Tests run in CI/CD pipeline
- [ ] Test database isolated from development database
- [ ] All tests pass consistently

**Test Structure:**
```
backend/
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── embedding.test.ts
│   │   └── validation.test.ts
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── notes.test.ts
│   │   ├── search.test.ts
│   │   └── tags.test.ts
│   └── setup.ts (test database setup)
```

**Sample Integration Test:**
```typescript
// backend/tests/integration/auth.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { app } from '../src/index';

describe('Authentication', () => {
  let authToken: string;

  test('POST /auth/register creates new user', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123',
          name: 'Test User',
          terms_accepted: true,
        }),
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('test@example.com');
    expect(data.data.access_token).toBeDefined();

    authToken = data.data.access_token;
  });

  test('POST /auth/login authenticates user', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123',
        }),
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.access_token).toBeDefined();
  });

  test('GET /auth/me returns current user', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.user.email).toBe('test@example.com');
  });
});
```

---

### Story 2: Frontend Testing (Component + E2E)

**Goal:** Test critical frontend components and user flows.

**Key Tasks:**
- Set up React Testing Library
- Write component tests for forms (login, register, note editor)
- Set up Playwright or Cypress for E2E tests
- Test critical flows: login → create note → search → logout
- Test error scenarios
- Add visual regression testing (optional)

**Acceptance Criteria:**
- [ ] Testing framework configured (React Testing Library + Playwright)
- [ ] Component tests cover: LoginForm, RegisterForm, NoteEditor, SearchResults
- [ ] E2E tests cover: User registration, Login, Create note, Search, Logout
- [ ] Tests run in headless mode
- [ ] Tests pass in CI/CD pipeline
- [ ] Screenshots captured on test failures

**E2E Test Example:**
```typescript
// frontend/tests/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete auth flow', async ({ page }) => {
  // Register new user
  await page.goto('http://localhost:3000/register');
  await page.fill('[name="email"]', 'e2e@example.com');
  await page.fill('[name="password"]', 'SecurePass123');
  await page.fill('[name="name"]', 'E2E User');
  await page.check('[name="terms_accepted"]');
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);

  // Create a note
  await page.goto('http://localhost:3000/notes/new');
  await page.fill('[name="title"]', 'Test Note');
  await page.fill('[name="content"]', '# Test Content\n\nThis is a test.');
  await page.click('button[type="submit"]');

  // Should redirect to notes list
  await expect(page).toHaveURL(/.*notes/);
  await expect(page.locator('text=Test Note')).toBeVisible();

  // Logout
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Log Out');

  // Should redirect to login
  await expect(page).toHaveURL(/.*login/);
});
```

---

### Story 3: Performance Optimization

**Goal:** Optimize database queries, frontend bundle, and API response times.

**Key Tasks:**
- Analyze slow database queries with EXPLAIN
- Optimize pgvector HNSW index parameters
- Reduce frontend bundle size (code splitting, tree shaking)
- Add database connection pooling
- Implement API response caching (optional)
- Optimize Transformers.js model loading

**Acceptance Criteria:**
- [ ] Database queries complete in <100ms (excluding search)
- [ ] Search queries complete in <2s (NFR2 target met)
- [ ] Frontend bundle size <500KB (gzipped)
- [ ] Lighthouse score >90 for performance
- [ ] Connection pooling prevents connection exhaustion
- [ ] Model loaded once and cached in memory

**Optimization Checklist:**

**Database:**
- [ ] All foreign keys have indexes
- [ ] HNSW index tuned (m=16, ef_construction=64)
- [ ] GIN index on tags array
- [ ] Composite index on (user_id, created_at)
- [ ] Connection pool: min=2, max=10

**Frontend:**
- [ ] Next.js bundle analyzed with `@next/bundle-analyzer`
- [ ] Large libraries dynamically imported
- [ ] Images optimized with next/image
- [ ] Unused dependencies removed
- [ ] Production build size verified

**Backend:**
- [ ] Embedding model loaded once at startup
- [ ] Database queries use prepared statements
- [ ] Response compression enabled (gzip)
- [ ] Unnecessary data excluded from responses

---

### Story 4: Production Deployment Setup

**Goal:** Deploy application to VPS with Docker Compose, nginx, and SSL.

**Key Tasks:**
- Provision VPS (DigitalOcean, Hetzner, etc.)
- Install Docker and Docker Compose on VPS
- Create production `docker-compose.prod.yml`
- Configure nginx reverse proxy
- Set up SSL with Let's Encrypt
- Configure domain DNS (if using custom domain)
- Set up environment variables securely

**Acceptance Criteria:**
- [ ] VPS provisioned with 2 vCPU, 4GB RAM, 20GB SSD
- [ ] Docker and Docker Compose installed
- [ ] Application runs with `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Nginx serves frontend on port 443 (HTTPS)
- [ ] Backend accessible at `/api` path
- [ ] SSL certificate valid (Let's Encrypt)
- [ ] Environment variables loaded from `.env.production`
- [ ] Application accessible at domain or VPS IP

**Production Docker Compose:**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: personal_vault
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/personal_vault
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: https://${DOMAIN}/api/v1
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  certbot_data:
```

**Nginx Configuration:**
```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # MCP Server (SSE)
    location /mcp/ {
        proxy_pass http://backend:8000/mcp/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

---

### Story 5: Monitoring, Backups & Documentation

**Goal:** Set up monitoring, automated backups, and comprehensive documentation.

**Key Tasks:**
- Add health check endpoints
- Set up automated database backups (pg_dump cron job)
- Configure logging (structured logs with timestamps)
- Set up uptime monitoring (UptimeRobot, Healthchecks.io)
- Write deployment guide
- Write user manual
- Update README with production setup

**Acceptance Criteria:**
- [ ] `/health` endpoint returns 200 OK
- [ ] Database backed up daily to S3 or local storage
- [ ] Logs rotated with logrotate
- [ ] Uptime monitoring pings health endpoint every 5 minutes
- [ ] Deployment guide includes step-by-step VPS setup
- [ ] User manual covers: registration, notes, search, MCP setup
- [ ] README updated with production deployment instructions

**Health Check Endpoint:**
```typescript
// backend/src/routes/health.ts
app.get('/health', async () => {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        embedding: 'up',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
});
```

**Backup Script:**
```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="personal_vault"

# Create backup
docker-compose exec -T postgres pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

**Cron Job (daily at 2 AM):**
```bash
0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

**Documentation Structure:**
```
docs/
├── deployment-guide.md        # VPS setup, Docker, nginx, SSL
├── user-manual.md             # How to use the application
├── mcp-setup-guide.md         # IDE configuration for MCP
├── troubleshooting.md         # Common issues and solutions
├── api-documentation.md       # Swagger/OpenAPI docs
└── architecture.md            # (Already exists)
```

---

## Dependencies

**Depends On:**
- ✅ All previous epics (1-7)

**Blocks:**
- None (Final epic)

---

## Risk Mitigation

### Primary Risks

1. **Production Deployment Failures**
   - Risk: Docker containers fail to start on VPS
   - Mitigation: Test production build locally first, document rollback
   - Contingency: Keep development environment as fallback

2. **SSL Certificate Issues**
   - Risk: Let's Encrypt fails to issue certificate
   - Mitigation: Test certbot locally, use DNS verification if HTTP fails
   - Fallback: Use self-signed cert temporarily

3. **Database Migration in Production**
   - Risk: Migrations fail and corrupt production database
   - Mitigation: Backup before migration, test migrations in staging
   - Rollback: Restore from backup, rollback migration

4. **VPS Resource Exhaustion**
   - Risk: 4GB RAM insufficient for Transformers.js + PostgreSQL
   - Mitigation: Monitor memory usage, upgrade VPS if needed
   - Optimization: Consider offloading embeddings to separate service

---

## Definition of Done

- [ ] All 5 stories completed with acceptance criteria met
- [ ] Backend test coverage >80%
- [ ] Frontend E2E tests pass
- [ ] Performance targets met (search <2s, queries <100ms)
- [ ] Application deployed to production VPS
- [ ] SSL certificate installed and valid
- [ ] Health checks and monitoring operational
- [ ] Database backups automated
- [ ] Documentation complete and published

---

## Testing Strategy

### Test Pyramid
- **Unit Tests (70%)**: Fast, isolated tests for utilities and business logic
- **Integration Tests (20%)**: API endpoint tests with test database
- **E2E Tests (10%)**: Critical user flows in full environment

### CI/CD Pipeline
1. **On Pull Request**: Run unit + integration tests
2. **On Merge to Main**: Run all tests + build Docker images
3. **On Tag (Release)**: Deploy to production VPS

---

## Success Metrics

**Quality:** Test coverage >80%, zero critical bugs in production

**Performance:** All NFRs met (search <2s, API <100ms)

**Reliability:** 99% uptime in first month

**Security:** No vulnerabilities in dependencies (npm audit / snyk)

---

## Notes for Developers

- **Test early and often** - Don't leave testing until the end
- **Monitor production metrics** - Watch for memory leaks, slow queries
- **Document everything** - Future you will thank you
- **Backup before changes** - Always have a rollback plan

---

## Post-Epic Considerations

After Epic 8 is complete, consider these post-MVP enhancements:
- Add email notifications (password reset, digest emails)
- Implement collaborative features (sharing notes)
- Build mobile app or PWA
- Add advanced analytics (note usage, search patterns)
- Integrate more AI features (auto-tagging, summarization)

---

## 🎉 Congratulations!

Once this epic is complete, you will have a **fully functional, production-ready BMad-Personal-Vault** deployed to a VPS with comprehensive testing, monitoring, and documentation.

**Final Checklist:**
- [ ] Users can register and login
- [ ] Users can create, edit, delete notes
- [ ] Semantic search works with pgvector
- [ ] MCP server accessible from IDEs
- [ ] Application deployed to VPS with SSL
- [ ] Tests passing with >80% coverage
- [ ] Monitoring and backups operational
- [ ] Documentation complete

**You've built a self-hosted AI knowledge base from scratch!** 🚀
