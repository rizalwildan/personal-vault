# Database Schema

Complete PostgreSQL schema with all tables, indexes, and constraints. This schema implements the data models defined earlier with optimizations for performance and data integrity.

## Prerequisites

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Tables

### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX users_email_idx ON users(email);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

### notes

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(384), -- 384-dimensional embeddings
  embedding_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
  tags TEXT[] NOT NULL DEFAULT '{}', -- Denormalized tags array
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX notes_user_id_created_at_idx ON notes(user_id, created_at DESC);
CREATE INDEX notes_user_id_updated_at_idx ON notes(user_id, updated_at DESC);
CREATE INDEX notes_embedding_status_idx ON notes(embedding_status) 
  WHERE embedding_status != 'completed';
CREATE INDEX notes_tags_gin_idx ON notes USING GIN(tags);
CREATE INDEX notes_is_archived_idx ON notes(user_id, is_archived) 
  WHERE is_archived = false;

-- HNSW index for fast vector similarity search
CREATE INDEX notes_embedding_hnsw_idx ON notes 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Triggers
CREATE TRIGGER notes_updated_at_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to reset embedding status when content changes
CREATE OR REPLACE FUNCTION reset_embedding_on_content_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.embedding_status = 'pending';
    NEW.embedding = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_content_change_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION reset_embedding_on_content_change();
```

**HNSW Parameters:**
- `m = 16` - Number of bi-directional links per node (trade-off: recall vs speed)
- `ef_construction = 64` - Size of dynamic candidate list (higher = better recall, slower build)
- These values optimized for ~10K notes per user

---

### tags

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7), -- Hex color code (#RRGGBB)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name) -- Unique tag names per user
);

-- Indexes
CREATE INDEX tags_user_id_idx ON tags(user_id);
CREATE INDEX tags_name_idx ON tags(name);

-- Constraint for hex color validation
ALTER TABLE tags ADD CONSTRAINT tags_color_check 
  CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');
```

---

### sessions

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX sessions_token_hash_idx ON sessions(token_hash);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

-- Auto-cleanup expired sessions (optional, can be cron job)
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run cleanup on every insert (lightweight, runs async)
CREATE TRIGGER sessions_cleanup_trigger
  AFTER INSERT ON sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION delete_expired_sessions();
```

---

## Database Size Estimation

**Assumptions:**
- 1,000 users
- Average 500 notes per user (500K total notes)
- Average note size: 2KB content + 384-dim vector (1.5KB)

**Calculations:**

| Table | Row Size | Row Count | Total Size | With Indexes | Total |
|-------|----------|-----------|------------|--------------|-------|
| users | 500 bytes | 1,000 | 0.5 MB | +0.5 MB | 1 MB |
| notes | 3.5 KB | 500,000 | 1.75 GB | +2.3 GB (HNSW 30%, GIN 20%) | 4 GB |
| tags | 200 bytes | 10,000 | 2 MB | +2 MB | 4 MB |
| sessions | 300 bytes | 5,000 | 1.5 MB | +1.5 MB | 3 MB |
| **Total** | | | **1.75 GB** | **2.3 GB** | **~4 GB** |

**Scaling:**
- 10K users, 5M notes → ~40 GB
- 100K users, 50M notes → ~400 GB
- PostgreSQL can handle 1TB+ with proper tuning

---

## Drizzle ORM Schema Files

For reference, here's how the schema maps to Drizzle ORM:

```typescript
// backend/src/db/schema/index.ts
export * from './users';
export * from './notes';
export * from './tags';
export * from './sessions';

// backend/src/db/schema/users.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  avatar_url: text('avatar_url'),
  terms_accepted_at: timestamp('terms_accepted_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// backend/src/db/schema/notes.ts
import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  embedding: customType<number[]>({
    dataType() { return 'vector(384)'; },
  })('embedding'),
  embedding_status: varchar('embedding_status', { length: 20 }).notNull().default('pending'),
  tags: text('tags').array().notNull().default([]),
  is_archived: boolean('is_archived').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  user_id_created_at_idx: index('notes_user_id_created_at_idx').on(table.user_id, table.created_at),
  user_id_updated_at_idx: index('notes_user_id_updated_at_idx').on(table.user_id, table.updated_at),
  tags_gin_idx: index('notes_tags_gin_idx').on(table.tags),
}));

// backend/src/db/schema/tags.ts
import { pgTable, uuid, varchar, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  user_id_idx: index('tags_user_id_idx').on(table.user_id),
  name_idx: index('tags_name_idx').on(table.name),
  user_id_name_unique: unique('tags_user_id_name_unique').on(table.user_id, table.name),
}));

// backend/src/db/schema/sessions.ts
import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token_hash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  user_id_idx: index('sessions_user_id_idx').on(table.user_id),
  expires_at_idx: index('sessions_expires_at_idx').on(table.expires_at),
}));
```

---

## Migration Strategy

**Initial Setup (v0.1.0):**
```bash
# Using Drizzle Kit
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg

# Or raw SQL
psql -U postgres -d personal_vault < schema.sql
```

**Future Migrations:**
- Use Drizzle Kit for schema changes
- Version migrations in `backend/migrations/` folder
- Apply migrations in CI/CD pipeline before deployment

---

