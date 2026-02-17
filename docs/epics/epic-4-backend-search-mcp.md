# Epic 4: Backend Search & MCP Server Integration

**Status:** Not Started
**Priority:** HIGH (Core Feature)
**Estimated Duration:** 5-7 days
**Dependencies:** Epic 1 (Infrastructure), Epic 3 (Notes CRUD with embeddings)

---

## Epic Goal

Implement semantic search functionality using pgvector cosine similarity and build the MCP (Model Context Protocol) server that enables IDE integration for `@knowledge-base` commands. This epic connects the knowledge base to AI assistants in IDEs like Cursor, VS Code, and Claude Desktop.

---

## Epic Description

### Context from Architecture

**Semantic Search:**
- Uses pgvector cosine distance for similarity search
- Query text embedded using same Transformers.js model
- Returns top K most relevant notes
- Supports hybrid search (semantic + full-text fallback)

**MCP Server:**
- Exposes notes as MCP resources
- Supports both stdio (local) and SSE (remote VPS) transport
- IDE calls `@knowledge-base` → MCP server queries notes → returns relevant context
- Authentication via API key for remote VPS deployments

**Performance Target (NFR2):**
- Search response time: <2 seconds total (including embedding generation)
- MCP resource fetch: <2 seconds

---

### What This Epic Delivers

1. **Semantic Search Endpoint**
   - `POST /api/v1/search` - Semantic search with pgvector
   - Query embedding generation
   - Cosine similarity ranking
   - Fallback to PostgreSQL full-text search if no embeddings

2. **MCP Server Implementation**
   - MCP server using `@modelcontextprotocol/sdk`
   - Resource: `knowledge-base://notes`
   - Tool: `search_knowledge_base(query)` - Search notes by query
   - Tool: `get_note(id)` - Get specific note by ID
   - Support for stdio transport (local development)
   - Support for SSE transport (VPS deployment)

3. **MCP Configuration**
   - IDE configuration templates (Cursor, VS Code, Claude Desktop)
   - Authentication setup for remote connections
   - Connection health checks

4. **Testing**
   - Search accuracy tests
   - MCP server integration tests
   - IDE configuration validation

---

## Stories

### Story 1: Semantic Search Implementation

**Goal:** Implement semantic search endpoint using pgvector cosine similarity.

**Key Tasks:**
- Create search route `POST /api/v1/search`
- Generate embedding for search query
- Query pgvector with cosine distance
- Return top K results ranked by similarity
- Add fallback to PostgreSQL full-text search
- Implement filtering (tags, date range)

**Acceptance Criteria:**
- [ ] `POST /api/v1/search` accepts query string and optional filters
- [ ] Query text embedded using Transformers.js (reuse embedding service)
- [ ] pgvector query uses cosine distance: `embedding <=> query_embedding`
- [ ] Returns top 10 results by default (configurable via limit param)
- [ ] Each result includes similarity score
- [ ] Falls back to full-text search if query embedding fails
- [ ] Filters work: tags, date range, is_archived
- [ ] Response time <2 seconds (including embedding generation)

**API Contract:**
```typescript
// POST /api/v1/search
// Request Body
{
  "query": "how to deploy docker containers",
  "limit": 10,
  "tags": ["docker"],
  "date_from": "2026-01-01",
  "date_to": "2026-02-16"
}

// Response 200 OK
{
  "success": true,
  "data": {
    "results": [
      {
        "note": {
          "id": "uuid",
          "title": "Docker Deployment Guide",
          "content": "...",
          "tags": ["docker", "devops"],
          "created_at": "..."
        },
        "similarity_score": 0.87,
        "matching_snippet": "...deploy docker containers using compose..."
      }
    ],
    "query_time_ms": 450
  }
}
```

**Implementation:**
```typescript
// backend/src/routes/search.ts
app.use(authMiddleware).post('/api/v1/search', async ({ body, currentUser }) => {
  const { query, limit = 10, tags, date_from, date_to } = body;
  const startTime = Date.now();

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Build pgvector query with filters
  const results = await db.execute(sql`
    SELECT
      id, title, content, tags, created_at,
      1 - (embedding <=> ${queryEmbedding}::vector) as similarity_score,
      ts_headline('english', content, plainto_tsquery(${query})) as snippet
    FROM notes
    WHERE user_id = ${currentUser.id}
      AND is_archived = false
      AND embedding IS NOT NULL
      ${tags ? sql`AND tags && ${tags}` : sql``}
      ${date_from ? sql`AND created_at >= ${date_from}` : sql``}
      ${date_to ? sql`AND created_at <= ${date_to}` : sql``}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `);

  const queryTime = Date.now() - startTime;

  return {
    success: true,
    data: {
      results: results.rows.map(row => ({
        note: {
          id: row.id,
          title: row.title,
          content: row.content,
          tags: row.tags,
          created_at: row.created_at,
        },
        similarity_score: row.similarity_score,
        matching_snippet: row.snippet,
      })),
      query_time_ms: queryTime,
    },
  };
});
```

---

### Story 2: MCP Server Foundation Setup

**Goal:** Initialize MCP server project using `@modelcontextprotocol/sdk`.

**Key Tasks:**
- Install `@modelcontextprotocol/sdk` in backend
- Create MCP server entry point (`backend/src/mcp/server.ts`)
- Configure server metadata (name, version, capabilities)
- Implement basic resource listing
- Set up stdio transport for local testing
- Add health check mechanism

**Acceptance Criteria:**
- [ ] MCP server initializes successfully
- [ ] Server exposes metadata (name: "BMad Personal Vault", version: "1.0.0")
- [ ] Stdio transport works for local testing
- [ ] Can list available resources
- [ ] Health check responds correctly
- [ ] Logs connection events

**MCP Server Structure:**
```typescript
// backend/src/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'bmad-personal-vault',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Register resources and tools (Story 3 & 4)

// Start server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.log('MCP Server running on stdio');
```

---

### Story 3: MCP Resources Implementation

**Goal:** Implement MCP resources for accessing notes.

**Key Tasks:**
- Register resource `knowledge-base://notes` (list all notes)
- Register resource `knowledge-base://notes/{id}` (get specific note)
- Implement resource content formatting (markdown)
- Add authentication check (validate API key for remote connections)
- Handle resource not found errors

**Acceptance Criteria:**
- [ ] `knowledge-base://notes` returns list of all user's notes
- [ ] `knowledge-base://notes/{id}` returns specific note content
- [ ] Note content formatted as markdown
- [ ] Resources include metadata (title, tags, created_at)
- [ ] Authentication validates API key from environment
- [ ] Returns proper error for non-existent notes
- [ ] IDE can successfully fetch resources

**Resource Implementation:**
```typescript
// Register resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  // Get user from API key (for remote connections)
  const user = await authenticateAPIKey();

  const notes = await db.query.notes.findMany({
    where: and(
      eq(notes.user_id, user.id),
      eq(notes.is_archived, false)
    ),
    orderBy: desc(notes.created_at),
  });

  return {
    resources: notes.map(note => ({
      uri: `knowledge-base://notes/${note.id}`,
      name: note.title,
      description: `Note with tags: ${note.tags.join(', ')}`,
      mimeType: 'text/markdown',
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const noteId = request.params.uri.split('/').pop();
  const user = await authenticateAPIKey();

  const note = await db.query.notes.findFirst({
    where: and(
      eq(notes.id, noteId),
      eq(notes.user_id, user.id)
    ),
  });

  if (!note) {
    throw new Error('Note not found');
  }

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: 'text/markdown',
        text: `# ${note.title}\n\n${note.content}`,
      },
    ],
  };
});
```

---

### Story 4: MCP Tools for Search and Retrieval

**Goal:** Implement MCP tools that IDEs can call for searching notes.

**Key Tasks:**
- Register tool `search_knowledge_base` (semantic search)
- Register tool `get_note` (get specific note)
- Implement tool schemas with JSON Schema validation
- Connect tools to existing search and notes endpoints
- Add rate limiting for tool calls

**Acceptance Criteria:**
- [ ] `search_knowledge_base` tool accepts query string parameter
- [ ] Returns top 5 most relevant notes
- [ ] `get_note` tool accepts note_id parameter
- [ ] Returns full note content
- [ ] Tools have proper JSON Schema definitions
- [ ] Error handling for invalid parameters
- [ ] IDE can successfully invoke tools

**Tool Implementation:**
```typescript
// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_knowledge_base',
        description: 'Search your personal knowledge base for relevant notes',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (e.g., "docker deployment", "authentication patterns")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 5)',
              default: 5,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_note',
        description: 'Retrieve a specific note by ID',
        inputSchema: {
          type: 'object',
          properties: {
            note_id: {
              type: 'string',
              description: 'UUID of the note',
            },
          },
          required: ['note_id'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const user = await authenticateAPIKey();

  if (request.params.name === 'search_knowledge_base') {
    const { query, limit = 5 } = request.params.arguments;

    // Reuse search logic from Story 1
    const results = await performSemanticSearch(user.id, query, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  if (request.params.name === 'get_note') {
    const { note_id } = request.params.arguments;

    const note = await db.query.notes.findFirst({
      where: and(eq(notes.id, note_id), eq(notes.user_id, user.id)),
    });

    if (!note) {
      throw new Error('Note not found');
    }

    return {
      content: [
        {
          type: 'text',
          text: `# ${note.title}\n\n${note.content}`,
        },
      ],
    };
  }

  throw new Error('Unknown tool');
});
```

---

### Story 5: IDE Configuration and SSE Transport

**Goal:** Add SSE transport for remote VPS connections and create IDE configuration templates.

**Key Tasks:**
- Implement SSE transport for remote connections
- Add API key authentication for remote MCP
- Create configuration templates for Cursor, VS Code, Claude Desktop
- Document MCP server setup process
- Test end-to-end IDE integration

**Acceptance Criteria:**
- [ ] SSE transport endpoint: `GET /mcp/sse` (with API key auth)
- [ ] API key validated from `X-API-Key` header
- [ ] Configuration templates created for 3 IDEs
- [ ] Local stdio configuration documented
- [ ] Remote VPS configuration documented
- [ ] Test connection from at least one IDE
- [ ] README updated with MCP setup instructions

**SSE Transport:**
```typescript
// backend/src/routes/mcp.ts
app.get('/mcp/sse', async ({ request, headers }) => {
  const apiKey = headers['x-api-key'];

  // Validate API key
  const user = await validateAPIKey(apiKey);
  if (!user) {
    throw new Error('Invalid API key');
  }

  // Create SSE transport
  const transport = new SSEServerTransport('/mcp/sse', request);
  await server.connect(transport);
});
```

**IDE Configuration Templates:**

```json
// Cursor/VS Code - Local (stdio)
// .cursor/config.json or .vscode/settings.json
{
  "mcpServers": {
    "personal-vault": {
      "command": "bun",
      "args": ["run", "/path/to/backend/src/mcp/server.ts"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "USER_ID": "your-user-id"
      }
    }
  }
}

// Cursor/VS Code - Remote VPS (SSE)
{
  "mcpServers": {
    "personal-vault": {
      "url": "https://your-vps.com/mcp/sse",
      "headers": {
        "X-API-Key": "your-api-key"
      }
    }
  }
}

// Claude Desktop - Local (stdio)
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
{
  "mcpServers": {
    "personal-vault": {
      "command": "bun",
      "args": ["run", "/Users/you/projects/personal-vault/backend/src/mcp/server.ts"]
    }
  }
}
```

---

## Dependencies

**Depends On:**
- ✅ Epic 1: Foundation & Infrastructure
- ✅ Epic 3: Backend Notes CRUD (needs notes with embeddings)

**Blocks:**
- Epic 7: Frontend Search Logic (needs search endpoint)

---

## Risk Mitigation

### Primary Risks

1. **MCP SDK Compatibility Issues**
   - Risk: MCP SDK may have breaking changes or bugs
   - Mitigation: Pin SDK version, test with multiple IDE versions
   - Fallback: Document known issues and workarounds

2. **Search Performance with Large Datasets**
   - Risk: pgvector cosine distance slow with 10K+ notes
   - Mitigation: HNSW index optimization (m=16, ef_construction=64)
   - Monitoring: Log query times, alert if >2s

3. **API Key Security for Remote MCP**
   - Risk: API keys leaked or stolen
   - Mitigation: Use strong random keys, support key rotation, rate limiting
   - Best Practice: Document secure key storage practices

4. **IDE Connection Failures**
   - Risk: MCP server crashes or becomes unreachable
   - Mitigation: Implement reconnection logic, health checks, error logging
   - UX: Clear error messages in IDE

---

## Definition of Done

- [ ] All 5 stories completed with acceptance criteria met
- [ ] Semantic search working with <2s response time
- [ ] MCP server exposes resources and tools correctly
- [ ] Both stdio and SSE transports functional
- [ ] IDE configuration templates created and documented
- [ ] At least one IDE successfully connects and queries knowledge base
- [ ] Authentication working for remote connections
- [ ] Integration tests cover search and MCP functionality

---

## Testing Strategy

### Search Testing
- Accuracy: Semantic search returns relevant results
- Performance: Query time <2 seconds
- Fallback: Full-text search works when embeddings unavailable

### MCP Testing
- Connection: stdio and SSE transports connect successfully
- Resources: Can list and read notes via MCP
- Tools: search_knowledge_base and get_note work correctly
- Auth: API key validation blocks unauthorized access

### IDE Integration Testing
- Manual test with Cursor/VS Code/Claude Desktop
- Verify `@knowledge-base` command returns relevant notes
- Test error scenarios (server down, invalid API key)

---

## Success Metrics

**Search Accuracy:** User finds relevant note in top 5 results >90% of time

**Search Performance:** <2 seconds response time (target met)

**MCP Reliability:** IDE successfully connects >99% of attempts

---

## Notes for Developers

- **MCP is the killer feature** - This is what makes the system useful in IDEs
- **Test with real IDEs** - Don't just test programmatically, actually use Cursor/VS Code
- **API key rotation** - Users should be able to regenerate keys if compromised
- **Monitor search quality** - Consider adding relevance feedback mechanism later

---

## Handoff to Next Epic

Once Epic 4 is complete, Epic 5 (Frontend Auth Logic) can begin. Developers will have:
- ✅ Working semantic search
- ✅ MCP server functional
- ✅ IDE integration possible

Epic 5 will implement the frontend logic to connect the existing UI to the backend authentication system.
