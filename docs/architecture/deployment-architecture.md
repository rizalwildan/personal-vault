# Deployment Architecture

## Production Stack

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

## Docker Production Build

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

## Docker Compose Production

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

## Nginx Configuration

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

## Deployment Checklist

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
