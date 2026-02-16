# Components

This section describes the major code components (modules, services, libraries) that form the building blocks of both frontend and backend. Each component has a clear responsibility and interface.

## Backend Components

### 1. Authentication Service (`backend/src/services/auth.service.ts`)

**Responsibility:** User authentication, JWT token generation/validation, password hashing.

**Key Methods:**
- `register(email, password, name, terms_accepted)` → `{ user, access_token, refresh_token }`
- `login(email, password)` → `{ user, access_token, refresh_token }`
- `logout(refresh_token)` → `void`
- `refreshToken(refresh_token)` → `{ access_token, refresh_token }`
- `validateAccessToken(token)` → `{ user_id, email }`

**Dependencies:**
- `bcrypt` - Password hashing (cost factor: 12)
- `jsonwebtoken` - JWT signing and verification
- `UserRepository` - Database access
- `SessionRepository` - Session management

**Configuration:**
- JWT secret from environment variable `JWT_SECRET`
- Access token expiry: 1 hour
- Refresh token expiry: 30 days

---

### 2. Notes Service (`backend/src/services/notes.service.ts`)

**Responsibility:** CRUD operations for notes, orchestrate embedding generation.

**Key Methods:**
- `create(user_id, title, content, tags)` → `Note`
- `update(note_id, user_id, updates)` → `Note`
- `delete(note_id, user_id)` → `void`
- `getById(note_id, user_id)` → `Note | null`
- `list(user_id, filters, pagination)` → `{ notes, pagination }`
- `triggerReindex(note_id, user_id)` → `void`

**Dependencies:**
- `NotesRepository` - Database access
- `EmbeddingService` - Async embedding generation
- `TagService` - Tag validation and creation

**Business Logic:**
- On create/update: Set `embedding_status = 'pending'`, trigger async embedding
- On tag assignment: Auto-create tags if they don't exist
- On delete: Cascade delete embeddings (handled by database)

---

### 3. Embedding Service (`backend/src/services/embedding.service.ts`)

**Responsibility:** Generate multilingual embeddings using Transformers.js, manage embedding lifecycle.

**Key Methods:**
- `initialize()` → Load model on startup
- `generateEmbedding(text)` → `Float32Array` (384 dimensions)
- `processNote(note_id)` → Update embedding in database with retry logic
- `getModelInfo()` → `{ name, dimensions, status }`

**Implementation Details:**
```typescript
import { pipeline } from '@xenova/transformers';

class EmbeddingService {
  private model: any;
  private readonly MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  
  async initialize() {
    this.model = await pipeline('feature-extraction', this.MODEL_NAME);
  }
  
  async generateEmbedding(text: string): Promise<Float32Array> {
    const output = await this.model(text, { pooling: 'mean', normalize: true });
    return output.data; // 384-dim vector
  }
  
  async processNote(note_id: string, retryCount = 0) {
    try {
      const note = await this.notesRepo.getById(note_id);
      const embedding = await this.generateEmbedding(note.content);
      await this.notesRepo.updateEmbedding(note_id, embedding, 'completed');
    } catch (error) {
      if (retryCount < 3) {
        // Exponential backoff
        await sleep(Math.pow(2, retryCount) * 1000);
        return this.processNote(note_id, retryCount + 1);
      }
      await this.notesRepo.updateEmbeddingStatus(note_id, 'failed');
    }
  }
}
```

**Configuration:**
- Model cache directory: `backend/.cache/transformers`
- Max concurrent embedding jobs: 5
- Retry attempts: 3 with exponential backoff

**Performance:**
- Initial model load: ~2-3 seconds
- Embedding generation: 300-500ms per note (depending on length)
- Memory usage: ~200MB model + ~50MB per concurrent job

---

### 4. Search Service (`backend/src/services/search.service.ts`)

**Responsibility:** Semantic search using pgvector cosine similarity.

**Key Methods:**
- `semanticSearch(user_id, query, limit, threshold, tags)` → `SearchResult[]`
- `getSearchStats(user_id)` → `{ total_indexed, pending, failed }`

**Implementation:**
```typescript
async semanticSearch(
  user_id: string,
  query: string,
  limit: number = 10,
  threshold: number = 0.7,
  tags?: string[]
) {
  const query_embedding = await this.embeddingService.generateEmbedding(query);
  
  // Use Drizzle with pgvector extension
  const results = await db
    .select({
      note: notes,
      similarity: sql`1 - (${notes.embedding} <=> ${query_embedding})` // Cosine similarity
    })
    .from(notes)
    .where(
      and(
        eq(notes.user_id, user_id),
        eq(notes.embedding_status, 'completed'),
        eq(notes.is_archived, false),
        sql`1 - (${notes.embedding} <=> ${query_embedding}) >= ${threshold}`,
        tags ? sql`${notes.tags} @> ARRAY[${tags}]::text[]` : undefined
      )
    )
    .orderBy(sql`${notes.embedding} <=> ${query_embedding}`)
    .limit(limit);
    
  return results;
}
```

**Dependencies:**
- `EmbeddingService` - Query embedding generation
- `NotesRepository` - Database access with pgvector

---

### 5. MCP Service (`backend/src/services/mcp.service.ts`)

**Responsibility:** Model Context Protocol implementation for AI assistant integration.

**Key Methods:**
- `handleRequest(user_id, jsonrpc_request)` → `jsonrpc_response`
- `listTools()` → MCP tool definitions
- `executeTool(tool_name, params)` → tool result
- `listResources(user_id)` → User's notes as MCP resources
- `readResource(user_id, resource_uri)` → Note content

**MCP Tools Exposed:**
1. **search_notes** - Semantic search with natural language
2. **create_note** - Create new note
3. **update_note** - Update existing note
4. **list_tags** - List available tags

**Dependencies:**
- `@modelcontextprotocol/sdk` - Official MCP SDK
- `NotesService` - Note operations
- `SearchService` - Semantic search

---

### 6. Repository Layer

**Pattern:** Each entity has a dedicated repository for data access.

**Repositories:**

#### `UserRepository` (`backend/src/repositories/user.repository.ts`)
- `create(email, password_hash, name, terms_accepted_at)` → `User`
- `findByEmail(email)` → `User | null`
- `findById(id)` → `User | null`
- `update(id, updates)` → `User`

#### `NotesRepository` (`backend/src/repositories/notes.repository.ts`)
- `create(user_id, note_data)` → `Note`
- `update(id, updates)` → `Note`
- `delete(id)` → `void`
- `findById(id)` → `Note | null`
- `findByUser(user_id, filters, pagination)` → `{ notes, total }`
- `updateEmbedding(id, embedding, status)` → `void`

#### `TagRepository` (`backend/src/repositories/tag.repository.ts`)
- `create(user_id, name, color)` → `Tag`
- `update(id, updates)` → `Tag`
- `delete(id)` → `number` (affected notes count)
- `findByUser(user_id)` → `Tag[]`
- `findOrCreate(user_id, name)` → `Tag`

#### `SessionRepository` (`backend/src/repositories/session.repository.ts`)
- `create(user_id, token_hash, expires_at)` → `Session`
- `findByTokenHash(hash)` → `Session | null`
- `delete(token_hash)` → `void`
- `deleteExpired()` → `number` (deleted count)

---

## Frontend Components

### 1. Authentication Components

**Location:** `frontend/app/(auth)/`

#### `LoginForm` (`components/auth/login-form.tsx`)
- Email/password form with validation
- "Remember me" checkbox
- Error handling with toast notifications
- Redirects to dashboard on success

#### `RegisterForm` (`components/auth/register-form.tsx`)
- Full name, email, password, confirm password fields
- Terms of Service acceptance checkbox
- Password strength indicator
- Error handling with inline validation

#### `AuthProvider` (`components/providers/auth-provider.tsx`)
- Context provider for auth state
- JWT token management (localStorage)
- Auto-refresh tokens before expiry
- Logout function

---

### 2. Dashboard Components

**Location:** `frontend/app/(dashboard)/`

#### `DashboardStats` (`components/dashboard/dashboard-stats.tsx`)
- Display total notes, database health, last sync
- Real-time updates via SWR
- Loading skeletons for stats

#### `RecentNotes` (`components/dashboard/recent-notes.tsx`)
- List of 5 most recent notes
- Click to navigate to editor
- Empty state message

#### `MCPConnectionStatus` (`components/dashboard/mcp-status.tsx`)
- MCP server connection indicator
- Reconnect button on failure
- Status colors: green (connected), red (disconnected), yellow (connecting)

---

### 3. Notes Components

**Location:** `frontend/app/(dashboard)/notes/`

#### `NotesList` (`components/notes/notes-list.tsx`)
- Grid/list view of all notes
- Filter by tags, sort by date/title
- Search bar (triggers semantic search)
- Pagination controls
- Loading states with skeletons

#### `NoteCard` (`components/notes/note-card.tsx`)
- Title, excerpt (first 150 chars), tags
- Created/updated timestamps
- Edit and delete buttons
- Embedding status badge

#### `NoteEditor` (`components/notes/note-editor.tsx`)
- Split view: Markdown editor + preview
- Auto-save every 30 seconds
- Character count (0/100,000)
- Tag selector with autocomplete
- Save & Close button

#### `MarkdownPreview` (`components/notes/markdown-preview.tsx`)
- Renders markdown with react-markdown
- GFM support (tables, task lists, strikethrough)
- Syntax highlighting for code blocks
- Sanitized output (rehype-sanitize)

#### `TagSelector` (`components/notes/tag-selector.tsx`)
- Multi-select combobox
- Create new tags inline
- Color picker for tags
- Displays selected tags as badges

---

### 4. Search Components

#### `SearchBar` (`components/search/search-bar.tsx`)
- Debounced input (300ms)
- Loading spinner during search
- Keyboard shortcut (Cmd/Ctrl + K)
- Clear button

#### `SearchResults` (`components/search/search-results.tsx`)
- List of matching notes with similarity scores
- Highlighted query terms
- Empty state: "No results found"
- Click to open note in editor

---

### 5. Shared Components (shadcn/ui)

These components are already implemented in `frontend/components/ui/`:

- `Button`, `Input`, `Textarea`, `Label`
- `Card`, `Badge`, `Avatar`, `Separator`
- `Dialog`, `AlertDialog`, `Popover`, `Tooltip`
- `Select`, `Combobox`, `Checkbox`, `Switch`
- `Toast` (sonner integration)
- `Skeleton` (loading states)
- `ResizablePanel` (split view)

---

### 6. Hooks

**Location:** `frontend/hooks/`

#### `useAuth()` (`hooks/use-auth.ts`)
- Returns `{ user, login, logout, register, isLoading, isAuthenticated }`
- Manages auth state and token refresh

#### `useNotes()` (`hooks/use-notes.ts`)
- Returns `{ notes, createNote, updateNote, deleteNote, reindexNote, isLoading, error }`
- SWR-based data fetching with optimistic updates

#### `useSearch()` (`hooks/use-search.ts`)
- Returns `{ search, results, isLoading, clear }`
- Debounced semantic search

#### `useTags()` (`hooks/use-tags.ts`)
- Returns `{ tags, createTag, updateTag, deleteTag, isLoading }`
- Tag management with cache invalidation

---
