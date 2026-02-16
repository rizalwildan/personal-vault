# API Specification

This section defines the complete REST API contract for the backend service. All endpoints use JSON for request/response bodies unless otherwise specified. The API follows RESTful conventions and uses standard HTTP status codes.

## Base Configuration

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** Bearer JWT token in `Authorization` header
```
Authorization: Bearer <access_token>
```

**Response Format:** All endpoints return JSON with consistent structure:
```typescript
// Success response
{
  success: true,
  data: T // Type varies by endpoint
}

// Error response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request:**
```typescript
{
  email: string;      // Valid email format
  password: string;   // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
  name: string;       // 1-100 characters
  terms_accepted: boolean; // Must be true
}
```

**Response (201 Created):**
```typescript
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      terms_accepted_at: string; // ISO 8601
      created_at: string;
      updated_at: string;
    },
    access_token: string;  // JWT valid for 1 hour
    refresh_token: string; // JWT valid for 30 days
  }
}
```

**Errors:**
- `409 Conflict` - Email already registered
- `400 Bad Request` - Validation errors (weak password, invalid email, terms not accepted)

---

### POST /auth/login

Authenticate existing user.

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      terms_accepted_at: string;
      created_at: string;
      updated_at: string;
    },
    access_token: string;
    refresh_token: string;
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing fields

---

### POST /auth/logout

Invalidate current session (revoke refresh token).

**Request:**
```typescript
{
  refresh_token: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: null
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired token

---

### POST /auth/refresh

Exchange refresh token for new access token.

**Request:**
```typescript
{
  refresh_token: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    access_token: string;  // New access token
    refresh_token: string; // Same or new refresh token
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired refresh token

---

## Note Endpoints

### GET /notes

List all notes for authenticated user with optional filtering.

**Query Parameters:**
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 50, Max: 100
  tags?: string[];      // Filter by tag names (comma-separated)
  archived?: boolean;   // Default: false
  sort?: 'created_at' | 'updated_at' | 'title'; // Default: created_at
  order?: 'asc' | 'desc'; // Default: desc
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    notes: Array<{
      id: string;
      user_id: string;
      title: string;
      content: string;
      embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
      tags: string[];
      is_archived: boolean;
      created_at: string;
      updated_at: string;
    }>,
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    }
  }
}
```

---

### GET /notes/:id

Retrieve a single note by ID.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    title: string;
    content: string;
    embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
    tags: string[];
    is_archived: boolean;
    created_at: string;
    updated_at: string;
  }
}
```

**Errors:**
- `404 Not Found` - Note doesn't exist or doesn't belong to user

---

### POST /notes

Create a new note. Triggers async embedding generation.

**Request:**
```typescript
{
  title: string;      // 1-200 characters
  content: string;    // 1-100,000 characters
  tags?: string[];    // Optional, array of tag names
}
```

**Response (201 Created):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    title: string;
    content: string;
    embedding_status: 'pending'; // Initial status
    tags: string[];
    is_archived: boolean;
    created_at: string;
    updated_at: string;
  }
}
```

**Errors:**
- `400 Bad Request` - Validation errors (title too long, content empty, etc.)

---

### PATCH /notes/:id

Update existing note. Triggers re-indexing if content changed.

**Request:**
```typescript
{
  title?: string;
  content?: string;
  tags?: string[];      // Replaces existing tags
  is_archived?: boolean;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    title: string;
    content: string;
    embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
    tags: string[];
    is_archived: boolean;
    created_at: string;
    updated_at: string;
  }
}
```

**Errors:**
- `404 Not Found` - Note doesn't exist or doesn't belong to user
- `400 Bad Request` - Validation errors

---

### DELETE /notes/:id

Permanently delete a note.

**Response (200 OK):**
```typescript
{
  success: true,
  data: null
}
```

**Errors:**
- `404 Not Found` - Note doesn't exist or doesn't belong to user

---

### POST /notes/:id/reindex

Manually trigger re-indexing for a failed embedding.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    message: 'Re-indexing triggered',
    embedding_status: 'pending'
  }
}
```

**Errors:**
- `404 Not Found` - Note doesn't exist or doesn't belong to user

---

## Search Endpoint

### POST /search

Perform semantic search across user's notes.

**Request:**
```typescript
{
  query: string;        // 1-500 characters
  limit?: number;       // Default: 10, Max: 50
  threshold?: number;   // Similarity threshold 0.0-1.0, Default: 0.7
  tags?: string[];      // Optional tag filter
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    results: Array<{
      note: {
        id: string;
        user_id: string;
        title: string;
        content: string;
        tags: string[];
        created_at: string;
        updated_at: string;
      },
      similarity: number;  // 0.0 to 1.0
      rank: number;        // 1 to limit
    }>,
    query_metadata: {
      query: string;
      processing_time_ms: number;
      total_results: number;
    }
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid query or parameters

---

## Tag Endpoints

### GET /tags

List all tags for authenticated user.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    tags: Array<{
      id: string;
      user_id: string;
      name: string;
      color: string | null;  // Hex color code
      note_count: number;    // Number of notes with this tag
      created_at: string;
    }>
  }
}
```

---

### POST /tags

Create a new tag.

**Request:**
```typescript
{
  name: string;     // 1-50 characters, unique per user
  color?: string;   // Optional hex color (#RRGGBB)
}
```

**Response (201 Created):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    name: string;
    color: string | null;
    created_at: string;
  }
}
```

**Errors:**
- `409 Conflict` - Tag name already exists for user
- `400 Bad Request` - Validation errors

---

### PATCH /tags/:id

Update tag name or color.

**Request:**
```typescript
{
  name?: string;
  color?: string;
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    id: string;
    user_id: string;
    name: string;
    color: string | null;
    created_at: string;
  }
}
```

**Errors:**
- `404 Not Found` - Tag doesn't exist or doesn't belong to user
- `409 Conflict` - New name already exists
- `400 Bad Request` - Validation errors

---

### DELETE /tags/:id

Delete a tag. Notes with this tag will have it removed from their tags array.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    message: 'Tag deleted',
    notes_updated: number;  // Count of notes that had this tag removed
  }
}
```

**Errors:**
- `404 Not Found` - Tag doesn't exist or doesn't belong to user

---

## MCP Protocol Endpoints

These endpoints implement the Model Context Protocol for AI assistant integration.

### POST /mcp/messages

MCP message handler for stdio/SSE transport.

**Request:**
```typescript
{
  jsonrpc: '2.0',
  id: string | number,
  method: string,
  params?: unknown
}
```

**Supported Methods:**
- `initialize` - Initialize MCP session
- `tools/list` - List available MCP tools
- `tools/call` - Execute MCP tool
- `resources/list` - List user's notes as resources
- `resources/read` - Read specific note content

**Response (200 OK):**
```typescript
{
  jsonrpc: '2.0',
  id: string | number,
  result?: unknown,
  error?: {
    code: number,
    message: string,
    data?: unknown
  }
}
```

---

### GET /mcp/sse

Server-Sent Events endpoint for MCP streaming transport.

**Response:** `text/event-stream`
```
event: message
data: {"jsonrpc":"2.0","method":"notifications/initialized","params":{}}

event: message
data: {"jsonrpc":"2.0","method":"resources/updated","params":{}}
```

---

## Health & Status Endpoints

### GET /health

Check service health status.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    status: 'healthy',
    timestamp: string,
    database: {
      status: 'connected',
      latency_ms: number
    },
    embedding_service: {
      status: 'ready' | 'loading' | 'error',
      model: string
    }
  }
}
```

---

### GET /stats

Get user statistics for dashboard.

**Response (200 OK):**
```typescript
{
  success: true,
  data: {
    total_notes: number,
    archived_notes: number,
    total_tags: number,
    embedding_status: {
      completed: number,
      pending: number,
      processing: number,
      failed: number
    },
    database_health: number,  // 0-100 percentage
    last_sync: string | null, // ISO 8601
    storage_used_mb: number
  }
}
```

---
