# Backend Architecture

This section describes the Elysia.js backend structure, service layer architecture, dependency injection, and MCP protocol implementation.

## Technology Stack

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

## Directory Structure

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

## Application Entry Point

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

## Elysia App Configuration

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

## Authentication Middleware

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

## Route Example: Notes

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

## Service Layer: Embedding Service

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

## Background Job Queue

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

## MCP Protocol Implementation

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

## Error Handling

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

