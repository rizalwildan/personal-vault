# Core Workflows

This section describes the critical user flows and system processes, showing how components interact to deliver functionality.

## 1. User Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Fill registration form
    Frontend->>Frontend: Validate inputs (zod)
    Frontend->>Backend: POST /auth/register
    Backend->>Backend: Hash password (bcrypt)
    Backend->>Database: INSERT user
    Database-->>Backend: User created
    Backend->>Backend: Generate JWT tokens
    Backend->>Database: INSERT session
    Backend-->>Frontend: { user, tokens }
    Frontend->>Frontend: Store tokens (localStorage)
    Frontend->>User: Redirect to dashboard
```

**Steps:**
1. User fills form: name, email, password, accept terms
2. Frontend validates with `RegisterSchema` (zod)
3. Backend hashes password with bcrypt (cost: 12)
4. Backend creates user record with `terms_accepted_at = NOW()`
5. Backend generates access token (1h) and refresh token (30d)
6. Backend creates session record with hashed refresh token
7. Frontend stores tokens in localStorage
8. Frontend redirects to `/dashboard`

**Error Handling:**
- Email already exists → Show "Email already registered" error
- Weak password → Show password requirements
- Terms not accepted → Disable submit button

---

## 2. Create Note with Embedding Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant EmbeddingService
    participant Database

    User->>Frontend: Write note, click Save
    Frontend->>Backend: POST /notes { title, content, tags }
    Backend->>Database: INSERT note (status=pending)
    Database-->>Backend: Note created
    Backend->>Backend: Queue embedding job
    Backend-->>Frontend: Note (status=pending)
    Frontend->>User: Show "Indexing..." badge
    
    par Async Embedding
        Backend->>EmbeddingService: processNote(note_id)
        EmbeddingService->>EmbeddingService: Load content
        EmbeddingService->>EmbeddingService: Generate embedding (300-500ms)
        EmbeddingService->>Database: UPDATE note.embedding (status=completed)
    end
    
    Frontend->>Backend: Poll /notes/:id (every 5s)
    Backend->>Database: SELECT note
    Database-->>Backend: Note (status=completed)
    Backend-->>Frontend: Note (status=completed)
    Frontend->>User: Remove "Indexing..." badge
```

**Steps:**
1. User writes note in editor, clicks "Save"
2. Frontend validates and sends POST request
3. Backend creates note with `embedding_status = 'pending'`
4. Backend queues async embedding job (returns immediately)
5. Frontend shows note with "Indexing..." badge
6. **Async:** EmbeddingService generates 384-dim vector
7. **Async:** Database updated with embedding, status = 'completed'
8. Frontend polls every 5 seconds until status = 'completed'

**Retry Logic:**
- If embedding fails (timeout, OOM), retry 3 times with exponential backoff
- After 3 failures, set `embedding_status = 'failed'`
- User can manually trigger re-index via dashboard button

---

## 3. Semantic Search Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant EmbeddingService
    participant Database

    User->>Frontend: Type query in search bar
    Frontend->>Frontend: Debounce 300ms
    Frontend->>Backend: POST /search { query, limit, threshold }
    Backend->>EmbeddingService: generateEmbedding(query)
    EmbeddingService-->>Backend: query_vector (384-dim)
    Backend->>Database: SELECT with pgvector <=> (cosine similarity)
    Database-->>Backend: Matching notes with similarity scores
    Backend->>Backend: Filter by threshold (0.7)
    Backend-->>Frontend: { results, metadata }
    Frontend->>User: Display results with similarity scores
```

**Steps:**
1. User types query in search bar
2. Frontend debounces input (300ms) to avoid excessive requests
3. Backend generates embedding for query string
4. Database executes vector similarity search:
   ```sql
   SELECT *, 1 - (embedding <=> $1) AS similarity
   FROM notes
   WHERE user_id = $2
     AND embedding_status = 'completed'
     AND 1 - (embedding <=> $1) >= 0.7
   ORDER BY embedding <=> $1
   LIMIT 10
   ```
5. Results ranked by similarity (0.0 to 1.0)
6. Frontend displays with similarity percentage

**Performance:**
- Query embedding: 300-500ms
- Vector search: <50ms (HNSW index)
- Total: <600ms (meets NFR2: <2s)

---

## 4. MCP Integration Flow

```mermaid
sequenceDiagram
    participant AIAssistant
    participant MCP_Client
    participant Backend
    participant Database

    AIAssistant->>MCP_Client: Request: "Search my notes about Python"
    MCP_Client->>Backend: POST /mcp/messages (tools/call: search_notes)
    Backend->>Database: Semantic search
    Database-->>Backend: Matching notes
    Backend-->>MCP_Client: JSON-RPC response with notes
    MCP_Client->>AIAssistant: Present notes as context
    AIAssistant->>MCP_Client: Request: "Create note with summary"
    MCP_Client->>Backend: POST /mcp/messages (tools/call: create_note)
    Backend->>Database: INSERT note
    Backend-->>MCP_Client: JSON-RPC response with note_id
    MCP_Client->>AIAssistant: Confirm note created
```

**MCP Tools:**
1. **search_notes** - AI searches user's knowledge base
2. **create_note** - AI creates notes from conversation
3. **update_note** - AI updates existing notes
4. **list_tags** - AI views available tags

**Transport:** stdio (local) or SSE (remote)

---

## 5. JWT Token Refresh Flow

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Database

    Frontend->>Frontend: Check token expiry (every 5 min)
    Frontend->>Frontend: Access token expires in <5 min
    Frontend->>Backend: POST /auth/refresh { refresh_token }
    Backend->>Database: SELECT session by token_hash
    alt Session valid
        Database-->>Backend: Session found
        Backend->>Backend: Generate new access token
        Backend-->>Frontend: { access_token, refresh_token }
        Frontend->>Frontend: Update stored tokens
    else Session invalid/expired
        Database-->>Backend: Session not found
        Backend-->>Frontend: 401 Unauthorized
        Frontend->>Frontend: Clear tokens, redirect to login
    end
```

**Steps:**
1. Frontend checks token expiry every 5 minutes (background job)
2. If access token expires in <5 minutes, trigger refresh
3. Backend validates refresh token hash against sessions table
4. If valid, issue new access token (optionally rotate refresh token)
5. Frontend updates localStorage with new tokens
6. If invalid, logout user and redirect to login

---

## 6. Manual Re-indexing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant EmbeddingService
    participant Database

    User->>Frontend: Click "Re-index" button on failed note
    Frontend->>Backend: POST /notes/:id/reindex
    Backend->>Database: UPDATE embedding_status = 'pending'
    Backend->>Backend: Queue embedding job
    Backend-->>Frontend: { status: 'pending' }
    Frontend->>User: Show "Indexing..." badge
    
    par Async Embedding
        Backend->>EmbeddingService: processNote(note_id)
        EmbeddingService->>EmbeddingService: Generate embedding
        alt Success
            EmbeddingService->>Database: UPDATE (status=completed)
        else Failure after 3 retries
            EmbeddingService->>Database: UPDATE (status=failed)
        end
    end
```

**Trigger:** User clicks "Re-index" button on notes with `embedding_status = 'failed'`

---

