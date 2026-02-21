# Epic 3: Backend Notes CRUD & Embedding Generation

**Status:** Complete
**Priority:** CRITICAL (Core Feature)
**Estimated Duration:** 5-7 days
**Dependencies:** Epic 1 (Infrastructure), Epic 2 (Auth System)

---

## Epic Goal

Implement complete CRUD operations for notes with async embedding generation using Transformers.js multilingual model. This epic delivers the core knowledge management functionality that enables users to create, read, update, delete, and organize their technical notes with semantic search capabilities.

---

## Epic Description

### Context from Architecture

Notes are the primary entity in BMad-Personal-Vault. Each note contains:
- **Content**: Markdown text (technical notes, code snippets, solutions)
- **Metadata**: Title, tags, archive status, timestamps
- **Embedding**: 384-dimensional vector for semantic search (generated asynchronously)

**Key Technical Decisions:**
- **ORM**: Drizzle ORM with PostgreSQL
- **Embedding Model**: `paraphrase-multilingual-MiniLM-L12-v2` via Transformers.js
- **Embedding Strategy**: Async generation (note saved immediately, embedding generated in background)
- **Vector Storage**: pgvector extension (384 dimensions)
- **Tag Management**: Denormalized array in notes table (simple, fast, sufficient for MVP)

**Performance Requirements (NFR2):**
- Note creation: <500ms (excluding embedding generation)
- Note retrieval: <100ms
- Embedding generation: 300-500ms per note (async, non-blocking)

---

### What This Epic Delivers

1. **Database Schema**
   - `notes` table with pgvector embedding column
   - `tags` table for tag management
   - Drizzle ORM models with proper relationships

2. **Notes CRUD Endpoints**
   - `POST /api/v1/notes` - Create new note (triggers async embedding)
   - `GET /api/v1/notes` - List user's notes (pagination, filtering)
   - `GET /api/v1/notes/:id` - Get single note by ID
   - `PUT /api/v1/notes/:id` - Update note (re-triggers embedding)
   - `DELETE /api/v1/notes/:id` - Soft delete (mark as archived)

3. **Tags Endpoints**
   - `GET /api/v1/tags` - List user's tags
   - `POST /api/v1/tags` - Create new tag
   - `PUT /api/v1/tags/:id` - Update tag
   - `DELETE /api/v1/tags/:id` - Delete tag

4. **Embedding Service**
   - Transformers.js integration
   - Async job queue for embedding generation
   - Embedding status tracking ('pending', 'completed', 'failed')
   - Manual re-indexing endpoint

5. **Testing**
   - Unit tests for embedding service
   - Integration tests for all CRUD endpoints
   - Test coverage >80%

---

## Stories

### Story 1: Database Schema for Notes and Tags

**Goal:** Define and migrate database schema for notes with pgvector and tags.

**Key Tasks:**
- Create Drizzle schema for `notes` table with pgvector column
- Create Drizzle schema for `tags` table
- Add Zod schemas in `/shared/schemas/note.ts` and `/shared/schemas/tag.ts`
- Generate and apply migrations
- Add indexes for performance (user_id, created_at, tags GIN index, embedding HNSW index)

**Acceptance Criteria:**
- [ ] Notes table created with fields: id, user_id (FK), title, content, embedding (vector 384), embedding_status (enum), tags (text[]), is_archived (bool), created_at, updated_at
- [ ] Tags table created with fields: id, user_id (FK), name (unique per user), color, created_at
- [ ] Indexes created: notes.user_id, notes.created_at, notes.tags (GIN), notes.embedding (HNSW)
- [ ] Migration applied successfully
- [ ] Zod schemas exported from `/shared/schemas/`

**Database Schema (notes):**
```typescript
// backend/src/db/schema/notes.ts
import { pgTable, uuid, varchar, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const embeddingStatusEnum = pgEnum('embedding_status', ['pending', 'completed', 'failed']);

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  embedding: sql`vector(384)`, // pgvector column
  embedding_status: embeddingStatusEnum('embedding_status').default('pending').notNull(),
  tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
  is_archived: boolean('is_archived').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  user_id_idx: index('notes_user_id_idx').on(table.user_id),
  created_at_idx: index('notes_created_at_idx').on(table.created_at),
  tags_idx: index('notes_tags_idx').using('gin', table.tags),
  embedding_idx: index('notes_embedding_idx').using(
    'hnsw',
    table.embedding,
    sql`vector_cosine_ops`
  ).with({ m: 16, ef_construction: 64 }),
}));
```

**Zod Schema (shared/schemas/note.ts):**
```typescript
import { z } from 'zod';

export const NoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string(),
  embedding: z.array(z.number()).length(384).nullable(),
  embedding_status: z.enum(['pending', 'completed', 'failed']),
  tags: z.array(z.string()),
  is_archived: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).default([]),
});

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  is_archived: z.boolean().optional(),
});

export type Note = z.infer<typeof NoteSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
```

---

### Story 2: Transformers.js Embedding Service

**Goal:** Integrate Transformers.js for multilingual embedding generation.

**Key Tasks:**
- Install `@xenova/transformers` package
- Create embedding service that loads `paraphrase-multilingual-MiniLM-L12-v2` model
- Implement text preprocessing (clean markdown, truncate to model limits)
- Create async job queue for embedding generation (simple in-memory queue for MVP)
- Add embedding utility functions (generate, batch generate)
- Handle model loading and caching

**Acceptance Criteria:**
- [ ] Embedding service loads multilingual model on first use
- [ ] `generateEmbedding(text)` returns 384-dimensional vector
- [ ] Embedding generation takes 300-500ms per note (acceptable)
- [ ] Model cached in memory after first load (~120MB)
- [ ] Text preprocessing handles markdown syntax (remove formatting)
- [ ] Long text truncated to model limit (512 tokens)
- [ ] Error handling for model loading failures

**Implementation:**
```typescript
// backend/src/services/embedding.ts
import { pipeline } from '@xenova/transformers';

let embeddingModel: any = null;

async function loadModel() {
  if (!embeddingModel) {
    console.log('Loading embedding model (paraphrase-multilingual-MiniLM-L12-v2)...');
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
    );
    console.log('Embedding model loaded successfully!');
  }
  return embeddingModel;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await loadModel();

  // Preprocess text (remove markdown formatting, truncate)
  const cleanText = preprocessText(text);

  // Generate embedding
  const output = await model(cleanText, { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data) as number[];

  if (embedding.length !== 384) {
    throw new Error(`Invalid embedding dimensions: ${embedding.length}`);
  }

  return embedding;
}

function preprocessText(text: string): string {
  // Remove markdown formatting
  let clean = text
    .replace(/[#*_~`]/g, '') // Remove markdown symbols
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Extract link text
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  // Truncate to ~512 tokens (rough approximation: 1 token ≈ 4 chars)
  const maxChars = 2000;
  if (clean.length > maxChars) {
    clean = clean.substring(0, maxChars);
  }

  return clean;
}

// Async job queue (simple in-memory for MVP)
const embeddingQueue: Array<{ noteId: string; text: string }> = [];
let isProcessing = false;

export function queueEmbedding(noteId: string, text: string) {
  embeddingQueue.push({ noteId, text });
  processQueue(); // Start processing if not already running
}

async function processQueue() {
  if (isProcessing || embeddingQueue.length === 0) return;

  isProcessing = true;

  while (embeddingQueue.length > 0) {
    const job = embeddingQueue.shift()!;

    try {
      console.log(`Generating embedding for note ${job.noteId}...`);
      const embedding = await generateEmbedding(job.text);

      // Update note in database
      await db.update(notes)
        .set({
          embedding: sql`${embedding}::vector`,
          embedding_status: 'completed',
          updated_at: new Date(),
        })
        .where(eq(notes.id, job.noteId));

      console.log(`Embedding completed for note ${job.noteId}`);
    } catch (error) {
      console.error(`Embedding failed for note ${job.noteId}:`, error);

      await db.update(notes)
        .set({
          embedding_status: 'failed',
          updated_at: new Date(),
        })
        .where(eq(notes.id, job.noteId));
    }
  }

  isProcessing = false;
}
```

---

### Story 3: Create and List Notes Endpoints

**Goal:** Implement `POST /api/v1/notes` and `GET /api/v1/notes`.

**Key Tasks:**
- Create notes routes in `backend/src/routes/notes.ts`
- Implement create note endpoint (protected route)
- Save note immediately with `embedding_status: 'pending'`
- Queue embedding generation asynchronously
- Implement list notes endpoint with pagination, filtering, sorting
- Filter by tags, archive status, search query
- Return notes with pagination metadata

**Acceptance Criteria:**
- [ ] `POST /api/v1/notes` requires authentication (JWT middleware)
- [ ] Validates request body with `CreateNoteSchema`
- [ ] Note saved to database immediately (returns 201 Created)
- [ ] Embedding generation queued asynchronously (doesn't block response)
- [ ] Returns note object with `embedding_status: 'pending'`
- [ ] `GET /api/v1/notes` supports query params: page, limit, tags, is_archived, search
- [ ] Default pagination: page=1, limit=20
- [ ] Returns notes sorted by created_at DESC
- [ ] Returns pagination metadata (total, page, limit, totalPages)
- [ ] Integration tests cover all scenarios

**API Contract:**
```typescript
// POST /api/v1/notes
// Request Body
{
  "title": "How to use Docker Compose",
  "content": "# Docker Compose Guide\n\n...",
  "tags": ["docker", "devops"]
}

// Response 201 Created
{
  "success": true,
  "data": {
    "note": {
      "id": "uuid",
      "user_id": "uuid",
      "title": "How to use Docker Compose",
      "content": "# Docker Compose Guide\n\n...",
      "embedding": null,
      "embedding_status": "pending",
      "tags": ["docker", "devops"],
      "is_archived": false,
      "created_at": "2026-02-16T10:30:00Z",
      "updated_at": "2026-02-16T10:30:00Z"
    }
  }
}

// GET /api/v1/notes?page=1&limit=20&tags=docker&is_archived=false
// Response 200 OK
{
  "success": true,
  "data": {
    "notes": [ /* array of notes */ ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

### Story 4: Read, Update, Delete Notes Endpoints

**Goal:** Implement `GET /api/v1/notes/:id`, `PUT /api/v1/notes/:id`, `DELETE /api/v1/notes/:id`.

**Key Tasks:**
- Implement get single note endpoint (protected)
- Implement update note endpoint (re-queues embedding if content changed)
- Implement delete endpoint (soft delete: sets is_archived = true)
- Add authorization checks (user can only access their own notes)
- Handle 404 Not Found for non-existent notes
- Handle edge cases (empty updates, concurrent updates)

**Acceptance Criteria:**
- [ ] `GET /api/v1/notes/:id` returns single note (404 if not found)
- [ ] Returns 403 Forbidden if note belongs to different user
- [ ] `PUT /api/v1/notes/:id` validates request with `UpdateNoteSchema`
- [ ] Updates allowed fields: title, content, tags, is_archived
- [ ] If content changed, re-queues embedding generation
- [ ] Returns updated note with updated_at timestamp
- [ ] `DELETE /api/v1/notes/:id` soft deletes (sets is_archived = true)
- [ ] Returns 204 No Content on success
- [ ] All endpoints have authorization checks
- [ ] Integration tests cover all scenarios

**Update Endpoint Logic:**
```typescript
// PUT /api/v1/notes/:id
app.use(authMiddleware).put('/api/v1/notes/:id', async ({ params, body, currentUser }) => {
  const { id } = params;
  const updates = UpdateNoteSchema.parse(body);

  // Check note exists and belongs to user
  const note = await db.query.notes.findFirst({
    where: and(eq(notes.id, id), eq(notes.user_id, currentUser.id)),
  });

  if (!note) {
    throw new NotFoundError('Note not found');
  }

  // If content changed, re-queue embedding
  const contentChanged = updates.content && updates.content !== note.content;

  const updatedNote = await db.update(notes)
    .set({
      ...updates,
      embedding_status: contentChanged ? 'pending' : note.embedding_status,
      updated_at: new Date(),
    })
    .where(eq(notes.id, id))
    .returning();

  // Queue embedding if content changed
  if (contentChanged) {
    const combinedText = `${updates.title || note.title}\n\n${updates.content}`;
    queueEmbedding(id, combinedText);
  }

  return { success: true, data: { note: updatedNote[0] } };
});
```

---

### Story 5: Tags Management and Manual Re-indexing

**Goal:** Implement tag CRUD endpoints and manual re-indexing for embeddings.

**Key Tasks:**
- Implement `GET /api/v1/tags` (list user's tags)
- Implement `POST /api/v1/tags` (create new tag)
- Implement `PUT /api/v1/tags/:id` (update tag name/color)
- Implement `DELETE /api/v1/tags/:id` (delete tag, remove from notes)
- Implement `POST /api/v1/notes/reindex` (manually re-generate all embeddings)
- Handle cascade deletion (remove tag from all notes when deleted)

**Acceptance Criteria:**
- [ ] `GET /api/v1/tags` returns user's tags sorted alphabetically
- [ ] `POST /api/v1/tags` creates new tag (validates uniqueness per user)
- [ ] `PUT /api/v1/tags/:id` updates tag name/color
- [ ] `DELETE /api/v1/tags/:id` removes tag from all notes, then deletes tag
- [ ] `POST /api/v1/notes/reindex` re-queues embeddings for all user's notes
- [ ] Re-indexing returns job status (e.g., "45 notes queued for re-indexing")
- [ ] All endpoints require authentication
- [ ] Integration tests cover all scenarios

**Tags Endpoints:**
```typescript
// GET /api/v1/tags
{
  "success": true,
  "data": {
    "tags": [
      { "id": "uuid", "name": "docker", "color": "#3B82F6", "created_at": "..." },
      { "id": "uuid", "name": "typescript", "color": "#10B981", "created_at": "..." }
    ]
  }
}

// POST /api/v1/notes/reindex
{
  "success": true,
  "data": {
    "message": "Re-indexing started",
    "queued_count": 45
  }
}
```

**Re-indexing Implementation:**
```typescript
app.use(authMiddleware).post('/api/v1/notes/reindex', async ({ currentUser }) => {
  // Get all user's notes
  const userNotes = await db.query.notes.findMany({
    where: eq(notes.user_id, currentUser.id),
  });

  // Queue all notes for re-indexing
  for (const note of userNotes) {
    const combinedText = `${note.title}\n\n${note.content}`;
    queueEmbedding(note.id, combinedText);

    // Mark as pending
    await db.update(notes)
      .set({ embedding_status: 'pending' })
      .where(eq(notes.id, note.id));
  }

  return {
    success: true,
    data: {
      message: 'Re-indexing started',
      queued_count: userNotes.length,
    },
  };
});
```

---

## Dependencies

**Depends On:**
- ✅ Epic 1: Foundation & Infrastructure
- ✅ Epic 2: Backend Auth System (needs authentication middleware)

**Blocks:**
- Epic 4: Backend Search & MCP (needs notes with embeddings)
- Epic 6: Frontend Notes Logic (needs working CRUD endpoints)

---

## Risk Mitigation

### Primary Risks

1. **Transformers.js Model Loading Failures**
   - Risk: Model fails to download or load in Docker container
   - Mitigation: Pre-download model during Docker build, cache in volume
   - Fallback: If embedding fails, note still saved (embedding optional for basic CRUD)

2. **Embedding Generation Performance**
   - Risk: 300-500ms per note may feel slow for batch operations
   - Mitigation: Async queue prevents blocking, show progress indicator in frontend
   - Optimization: Could defer to Epic 4 if needed (use full-text search temporarily)

3. **Memory Usage for Model**
   - Risk: Transformers.js model uses ~120MB RAM, may impact small VPS
   - Mitigation: Document minimum RAM requirement (4GB recommended)
   - Monitoring: Log memory usage, add health check

4. **Concurrent Update Conflicts**
   - Risk: Two requests update same note simultaneously
   - Mitigation: Use database transactions with optimistic locking
   - UX: Frontend should show conflict resolution if needed

---

## Definition of Done

- [ ] All 5 stories completed with acceptance criteria met
- [ ] Database schema migrated with pgvector column
- [ ] Transformers.js embedding service working (384-dim vectors)
- [ ] All 9 endpoints implemented and tested (5 notes, 3 tags, 1 reindex)
- [ ] Async embedding queue processes notes successfully
- [ ] Integration tests cover all CRUD operations
- [ ] Swagger documentation for all endpoints
- [ ] Authorization checks prevent cross-user access
- [ ] Soft delete works (is_archived flag)

---

## Testing Strategy

### Unit Tests
- Embedding service (text preprocessing, vector generation)
- Tag cascade deletion logic
- Pagination logic

### Integration Tests
- Create note → verify saved, embedding queued
- List notes → verify pagination, filtering, sorting
- Update note → verify content change re-queues embedding
- Delete note → verify soft delete (is_archived = true)
- Tag CRUD operations
- Re-indexing → verify all notes queued

### Performance Tests
- Embedding generation time: 300-500ms per note (target)
- List notes query time: <100ms for 1000 notes
- Pagination performance with large datasets

---

## Success Metrics

**Performance:** Note creation <500ms (excluding embedding), retrieval <100ms

**Reliability:** Embedding success rate >95%

**Scalability:** System handles 10,000 notes per user without performance degradation

---

## Notes for Developers

- **Embeddings are async** - Don't block note creation waiting for embeddings
- **Use in-memory queue for MVP** - Can upgrade to Redis queue later if needed
- **Soft delete only** - Never hard delete notes (data preservation)
- **Test with Indonesian + English** - Embedding model supports both languages
- **Monitor memory usage** - Transformers.js model adds ~120MB overhead

---

## Handoff to Next Epic

Once Epic 3 is complete, Epic 4 (Backend Search & MCP) can begin. Developers will have:
- ✅ Notes with embeddings stored in pgvector
- ✅ CRUD endpoints working
- ✅ Tag management
- ✅ Embedding service operational

Epic 4 will implement semantic search using pgvector cosine similarity and MCP server integration.
